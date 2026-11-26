import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@edusphere/shared';

const router = Router();
const controller = new CourseController();

router.get('/', (req, res, next) => controller.listCourses(req, res, next));
router.get('/:id', (req, res, next) => controller.getCourseById(req, res, next));
router.post('/', authenticate, authorize(UserRole.COURSE_AUTHOR, UserRole.ADMIN), (req, res, next) => controller.createCourse(req, res, next));
router.put('/:id', authenticate, authorize(UserRole.COURSE_AUTHOR, UserRole.ADMIN), (req, res, next) => controller.updateCourse(req, res, next));
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.COURSE_AUTHOR), (req, res, next) => controller.updateStatus(req, res, next));

export default router;
