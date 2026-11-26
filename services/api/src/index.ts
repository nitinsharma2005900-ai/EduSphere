import { createApp } from './app';
import { config } from './config';
import { initializePersistence, pool } from './database/persistence';
import { fork } from 'child_process';

const app = createApp();

async function start() {
await initializePersistence();
const worker = process.env.REDIS_URL ? fork(require.resolve('./worker')) : null;
worker?.on('exit', code => { if (code) { console.error('Background worker exited unexpectedly'); process.exit(1); } });
const server = app.listen(config.port, '::', () => {
  console.log(`=======================================================`);
  console.log(`🚀 EduSphere Core API running on http://localhost:${config.port}`);
  console.log(`📚 Interactive Swagger API Docs: http://localhost:${config.port}/api/docs`);
  console.log(`📡 Ready for incoming requests from Web and Microservices`);
  console.log(`=======================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  worker?.kill('SIGTERM');
  server.close(() => {
    void pool?.end();
  });
});
}
void start().catch(error => { console.error('API startup failed:', error.message); process.exit(1); });
