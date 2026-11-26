import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { ProgressService } from '../services/progress.service';

const enrollmentService = new EnrollmentService();
const progressService = new ProgressService();

export class EnrollmentController {
  public async enroll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentService.enroll(
        req.user!.userId,
        req.params.courseId,
        req.body.paymentToken
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMyEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollments = await enrollmentService.getMyEnrollments(req.user!.userId);
      res.status(200).json({
        success: true,
        data: enrollments,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCurriculum(req: Request, res: Response, next: NextFunction) {
    try {
      const curriculum = await progressService.getCurriculum(req.params.courseId, req.user!.userId);
      res.status(200).json({
        success: true,
        data: curriculum,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await progressService.updateLessonProgress(
        req.params.lessonId,
        req.user!.userId,
        req.body
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
