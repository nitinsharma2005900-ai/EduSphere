import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 EduSphere Core API running on http://localhost:${config.port}`);
  console.log(`📚 Interactive Swagger API Docs: http://localhost:${config.port}/api/docs`);
  console.log(`📡 Ready for incoming requests from Web and Microservices`);
  console.log(`=======================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
