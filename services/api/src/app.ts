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

export const createApp = () => {
  const app = express();

  // Security headers & CORS
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(cors({
    origin: '*',
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

  app.get('/ready', (req: Request, res: Response) => {
    res.status(200).json({
      ready: true,
      database: 'CONNECTED',
      analyticsService: 'READY',
      storage: 'READY',
    });
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
  app.use('/api/v1', apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
