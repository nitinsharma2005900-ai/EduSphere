import { Request, Response, NextFunction } from 'express';
import { MemoryDataStore } from '../database/store';

const db = MemoryDataStore.getInstance();

export class AdminController {
  public async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const sanitized = db.users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      }));
      res.status(200).json({
        success: true,
        data: sanitized,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: db.auditLogs,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: db.categories,
      });
    } catch (err) {
      next(err);
    }
  }
}
