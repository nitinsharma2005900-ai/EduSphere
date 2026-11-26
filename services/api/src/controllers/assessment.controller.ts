import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment.service';
import { AssignmentService } from '../services/assignment.service';
import { requireCourseAccess } from '../services/access';
import { MemoryDataStore } from '../database/store';

const assessmentService = new AssessmentService();
const assignmentService = new AssignmentService();

export class AssessmentController {
  public async getAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const record = MemoryDataStore.getInstance().assessments.find(a => a.id === req.params.id);
      if (record) requireCourseAccess(record.courseId, req.user!.userId);
      const assessment = await assessmentService.getAssessment(req.params.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }

  public async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attempt = await assessmentService.startAttempt(req.params.id, req.user!.userId);
      res.status(201).json({
        success: true,
        data: attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attempt = await assessmentService.submitAttempt(
        req.params.id,
        req.user!.userId,
        req.body.answers || {},
        req.body.attemptId
      );
      res.status(200).json({
        success: true,
        data: attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  // Assignments
  public async getAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await assignmentService.getAssignment(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await assignmentService.submitAssignment(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        data: submission,
      });
    } catch (err) {
      next(err);
    }
  }

  public async listSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = MemoryDataStore.getInstance().assignments.find(a => a.id === req.params.id);
      if (assignment && req.user!.role === 'INSTRUCTOR') requireCourseAccess(assignment.courseId, req.user!.userId, true);
      const submissions = await assignmentService.listSubmissions(req.params.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err) {
      next(err);
    }
  }

  public async gradeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const graded = await assignmentService.gradeSubmission(
        req.params.submissionId,
        req.user!.userId,
        req.user!.role,
        req.body
      );
      res.status(200).json({
        success: true,
        data: graded,
      });
    } catch (err) {
      next(err);
    }
  }
}
