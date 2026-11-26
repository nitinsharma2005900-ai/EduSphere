import { Request, Response, NextFunction } from 'express';
import { IntegrationService } from '../services/integration.service';

const integrationService = new IntegrationService();

export class IntegrationController {
  public async createPaymentOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationService.createPaymentOrder(
        req.user!.userId,
        req.body.courseId
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async processSandboxWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationService.processSandboxWebhook(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async exportCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const ics = integrationService.generateIcsCalendar(req.params.courseId);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="course-${req.params.courseId}.ics"`);
      res.status(200).send(ics);
    } catch (err) {
      next(err);
    }
  }
}
