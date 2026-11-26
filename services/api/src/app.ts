import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';
import { config } from './config';
import { persistentRequest, pool } from './database/persistence';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

const healthRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { family: 0, lazyConnect: true, maxRetriesPerRequest: 1 }) : null;
healthRedis?.on('error', error => console.error('Redis health check:', error.message));

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  // Security headers & CORS
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(cors({
    origin: config.corsOrigin.split(',').map(origin => origin.trim()),
    credentials: true,
  }));

  // JSON Body parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Correlation Request ID & structured logging
  app.use((req: Request, res: Response, next) => {
    req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
    res.setHeader('x-request-id', req.requestId);
    next();
  });

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req-id: :req[x-request-id]]'));
  }

  // Health and Readiness endpoints
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'EduSphere Core Express API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/ready', async (req: Request, res: Response) => {
    try {
      if (pool) await pool.query('SELECT 1 FROM lms_state WHERE id = 1');
      const response = await fetch(`${config.analyticsServiceUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Analytics unavailable');
      if (healthRedis && !await healthRedis.get('edusphere:worker:heartbeat')) throw new Error('Worker heartbeat missing');
      res.json({ ready: true, database: pool ? 'CONNECTED' : 'DEVELOPMENT_MEMORY', analyticsService: 'READY', worker: healthRedis ? 'READY' : 'NOT_CONFIGURED' });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  // Swagger UI Interactive Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'EduSphere API Documentation',
  }));
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Versioned API Routes
  if (config.env !== 'test') {
    app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));
    app.use('/api/v1', rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));
  }
  app.use('/api/v1', persistentRequest, apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
