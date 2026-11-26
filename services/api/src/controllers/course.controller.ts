import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';

const courseService = new CourseService();

export class CourseController {
  public async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await courseService.listCourses({
        category: req.query.category as string,
        level: req.query.level as string,
        search: req.query.search as string,
        status: undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12,
      });
      res.status(200).json({
        success: true,
        data: result.courses,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await courseService.getCourseById(req.params.id);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  public async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const newCourse = await courseService.createCourse(req.body, req.user!.userId, req.user!.role);
      res.status(201).json({
        success: true,
        data: newCourse,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await courseService.updateCourse(req.params.id, req.body, req.user!.userId, req.user!.role);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const updated = await courseService.updateCourseStatus(req.params.id, status, req.user!.role, req.user!.userId);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
