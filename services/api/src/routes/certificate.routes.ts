import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@edusphere/shared';

const router = Router();
const controller = new CertificateController();

router.post('/courses/:courseId/claim', authenticate, (req, res, next) => controller.claimCertificate(req, res, next));
router.get('/my', authenticate, (req, res, next) => controller.getMyCertificates(req, res, next));
router.get('/verify/:certificateNumber', (req, res, next) => controller.verifyCertificate(req, res, next));
router.post('/:id/revoke', authenticate, authorize(UserRole.ADMIN), (req, res, next) => controller.revokeCertificate(req, res, next));

export default router;
