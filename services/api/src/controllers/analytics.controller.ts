import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { requireCourseAccess } from '../services/access';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  public async getPlatformOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await analyticsService.getPlatformOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCourseCohortAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      requireCourseAccess(req.params.courseId, req.user!.userId, true);
      const analytics = await analyticsService.getCourseCohortAnalytics(req.params.courseId);
      if (!analytics) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }
}
