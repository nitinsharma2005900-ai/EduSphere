import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { IntegrationController } from '../controllers/integration.controller';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@edusphere/shared';

export const analyticsRouter = Router();
const analyticsCtrl = new AnalyticsController();
analyticsRouter.get('/overview', (req, res, next) => analyticsCtrl.getPlatformOverview(req, res, next));
analyticsRouter.get('/cohort/:courseId', authenticate, (req, res, next) => analyticsCtrl.getCourseCohortAnalytics(req, res, next));

export const integrationRouter = Router();
const integrationCtrl = new IntegrationController();
integrationRouter.post('/payments/create-order', authenticate, (req, res, next) => integrationCtrl.createPaymentOrder(req, res, next));
integrationRouter.post('/payments/webhook', (req, res, next) => integrationCtrl.processSandboxWebhook(req, res, next));
integrationRouter.get('/calendar/:courseId/ics', (req, res, next) => integrationCtrl.exportCalendar(req, res, next));

export const adminRouter = Router();
const adminCtrl = new AdminController();
adminRouter.get('/users', authenticate, authorize(UserRole.ADMIN), (req, res, next) => adminCtrl.listUsers(req, res, next));
adminRouter.get('/audit-logs', authenticate, authorize(UserRole.ADMIN), (req, res, next) => adminCtrl.getAuditLogs(req, res, next));
adminRouter.get('/categories', (req, res, next) => adminCtrl.getCategories(req, res, next));
