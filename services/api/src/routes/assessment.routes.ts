import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@edusphere/shared';

const router = Router();
const controller = new AssessmentController();

// Assessments
router.get('/assessments/:id', authenticate, (req, res, next) => controller.getAssessment(req, res, next));
router.post('/assessments/:id/start', authenticate, (req, res, next) => controller.startAttempt(req, res, next));
router.post('/assessments/:id/submit', authenticate, (req, res, next) => controller.submitAttempt(req, res, next));

// Assignments
router.get('/assignments/:id', authenticate, (req, res, next) => controller.getAssignment(req, res, next));
router.post('/assignments/:id/submit', authenticate, (req, res, next) => controller.submitAssignment(req, res, next));
router.get('/assignments/:id/submissions', authenticate, authorize(UserRole.ASSESSOR, UserRole.INSTRUCTOR, UserRole.ADMIN), (req, res, next) => controller.listSubmissions(req, res, next));
router.post('/submissions/:submissionId/grade', authenticate, authorize(UserRole.ASSESSOR, UserRole.INSTRUCTOR, UserRole.ADMIN), (req, res, next) => controller.gradeSubmission(req, res, next));

export default router;
