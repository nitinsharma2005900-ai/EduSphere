import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'edusphere_jwt_super_secure_access_secret_key_2026_x9281!',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'edusphere_jwt_super_secure_refresh_secret_key_2026_r4719@',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || 'edusphere_internal_microservice_secret_key_2026_secure!',
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'localhost',
    port: parseInt(process.env.S3_PORT || '9000', 10),
    useSSL: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY || 'edusphere_minio_admin',
    secretKey: process.env.S3_SECRET_KEY || 'edusphere_minio_super_secret_pass_2026',
    bucketName: process.env.S3_BUCKET_NAME || 'edusphere-media',
    localUploadDir: path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || '../../storage/uploads'),
    certificateDir: path.resolve(process.cwd(), '../../storage/certificates'),
  },
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'EduSphere Platform <notifications@edusphere.demo>',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'STRIPE_SANDBOX',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_edusphere_mock_key_51NxYz',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_edusphere_mock_secret_key_98AbCd',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_edusphere_mock_webhook_secret_12345',
    sandboxMode: true,
  },
  video: {
    provider: process.env.VIDEO_PROVIDER || 'ADAPTIVE_MOCK_STREAMING',
    cdnBaseUrl: process.env.VIDEO_CDN_BASE_URL || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample',
  }
};
