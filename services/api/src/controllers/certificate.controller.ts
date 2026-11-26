import { Request, Response, NextFunction } from 'express';
import { CertificateService } from '../services/certificate.service';

const certificateService = new CertificateService();

export class CertificateController {
  public async claimCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const certificate = await certificateService.claimCertificate(
        req.params.courseId,
        req.user!.userId
      );
      res.status(201).json({
        success: true,
        data: certificate,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMyCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const certificates = await certificateService.getMyCertificates(req.user!.userId);
      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await certificateService.verifyPublicCertificate(req.params.certificateNumber);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async revokeCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const revoked = await certificateService.revokeCertificate(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        reason || 'Administrative policy violation'
      );
      res.status(200).json({
        success: true,
        data: revoked,
      });
    } catch (err) {
      next(err);
    }
  }
}
