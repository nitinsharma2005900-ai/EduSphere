import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new EnrollmentController();

router.post('/:courseId/enroll', authenticate, (req, res, next) => controller.enroll(req, res, next));
router.get('/my', authenticate, (req, res, next) => controller.getMyEnrollments(req, res, next));
router.get('/:courseId/curriculum', authenticate, (req, res, next) => controller.getCurriculum(req, res, next));
router.post('/lessons/:lessonId/progress', authenticate, (req, res, next) => controller.updateProgress(req, res, next));

export default router;
