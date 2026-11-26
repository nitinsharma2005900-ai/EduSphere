import { Router } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import enrollmentRoutes from './enrollment.routes';
import assessmentRoutes from './assessment.routes';
import certificateRoutes from './certificate.routes';
import { analyticsRouter, integrationRouter, adminRouter } from './other.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/', assessmentRoutes);
router.use('/certificates', certificateRoutes);
router.use('/analytics', analyticsRouter);
router.use('/integrations', integrationRouter);
router.use('/admin', adminRouter);

export default router;
