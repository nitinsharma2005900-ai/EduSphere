import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.middleware';
import { MemoryDataStore } from '../database/store';
import { getObject, putObject } from '../services/storage';
import { requireCourseAccess } from '../services/access';
import { config } from '../config';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { CertificateService } from '../services/certificate.service';
import { ProgressService } from '../services/progress.service';

const router = Router();
const db = MemoryDataStore.getInstance();
router.get('/resources/:lessonId', authenticate, async (req, res, next) => {
  try {
    const lesson = db.lessons.find(l => l.id === req.params.lessonId);
    const topic = db.topics.find(t => t.id === lesson?.topicId);
    if (!lesson || !topic) throw new NotFoundError('Lesson not found');
    const curriculum = await new ProgressService().getCurriculum(topic.courseId, req.user!.userId);
    if (!curriculum.topics.flatMap(t => t.lessons).some(l => l.id === lesson.id && !l.isLocked)) throw new ForbiddenError('Lesson is locked');
    const response = await fetch(`${config.analyticsServiceUrl}/api/v1/utilities/render-lesson-notes`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', 'X-Internal-Key': config.internalServiceKey }, body: JSON.stringify({ title: lesson.title, content: lesson.contentText || lesson.description }) });
    if (!response.ok) throw new Error('Resource rendering unavailable');
    res.type('application/pdf').setHeader('Content-Disposition', 'attachment; filename="lesson-notes.pdf"');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) { next(error); }
});
router.get('/notifications', authenticate, (req, res) => res.json({ success: true, data: db.notifications.filter(n => n.userId === req.user!.userId).slice().reverse() }));
router.patch('/notifications/:id/read', authenticate, (req, res, next) => {
  const notification = db.notifications.find(n => n.id === req.params.id && n.userId === req.user!.userId);
  if (!notification) return next(new NotFoundError('Notification not found'));
  notification.isRead = true;
  res.json({ success: true, data: notification });
});
router.get('/assignments', authenticate, (req, res) => {
  const user = req.user!;
  const ids = db.enrollments.filter(e => e.userId === user.userId && e.status !== 'SUSPENDED').map(e => e.courseId);
  const assignments = db.assignments.filter(a => user.role === 'LEARNER' ? ids.includes(a.courseId) : user.role === 'ADMIN' || user.role === 'ASSESSOR' || db.courses.some(c => c.id === a.courseId && (c.authorId === user.userId || c.instructorId === user.userId)));
  res.json({ success: true, data: assignments.map(a => ({ ...a, courseTitle: db.courses.find(c => c.id === a.courseId)?.title, submission: db.assignmentSubmissions.find(s => s.assignmentId === a.id && s.userId === user.userId) || null })) });
});
router.post('/files', authenticate, async (req, res, next) => {
  try {
    const data = z.object({ name: z.string().min(1).max(200), base64: z.string().min(1).max(14 * 1024 * 1024) }).parse(req.body);
    const extension = data.name.split('.').pop()!.toLowerCase();
    const contentType = ({ pdf: 'application/pdf', zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } as Record<string, string>)[extension];
    const body = Buffer.from(data.base64, 'base64');
    if (!contentType || body.length > 10 * 1024 * 1024 || !body.length) throw new ValidationError('Upload a PDF, ZIP or DOCX file up to 10 MB');
    if (extension === 'pdf' ? body.subarray(0, 5).toString() !== '%PDF-' : body.subarray(0, 2).toString() !== 'PK') throw new ValidationError('File content does not match its extension');
    const file = { id: randomUUID(), userId: req.user!.userId, name: data.name.replace(/[^a-zA-Z0-9._ -]/g, '_'), key: `assignments/${req.user!.userId}/${randomUUID()}.${extension}`, size: body.length, contentType };
    await putObject(file.key, body, contentType);
    db.uploadedFiles.push(file);
    res.status(201).json({ success: true, data: { fileUrl: `/api/v1/files/${file.id}`, fileName: file.name, fileSize: file.size } });
  } catch (error) { next(error); }
});
router.get('/files/:id', authenticate, async (req, res, next) => {
  try {
    const file = db.uploadedFiles.find(f => f.id === req.params.id);
    if (!file) throw new NotFoundError('File not found');
    const user = req.user!;
    if (file.userId !== user.userId && !['ADMIN', 'ASSESSOR'].includes(user.role)) {
      const submission = db.assignmentSubmissions.find(s => s.fileUrl === `/api/v1/files/${file.id}`);
      const assignment = db.assignments.find(a => a.id === submission?.assignmentId);
      if (!assignment) throw new ForbiddenError('File access denied');
      requireCourseAccess(assignment.courseId, user.userId, true);
    }
    const object = await getObject(file.key);
    res.type(file.contentType).setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.send(Buffer.from(await object.Body!.transformToByteArray()));
  } catch (error) { next(error); }
});
router.get('/certificates/verify/:number/pdf', async (req, res, next) => {
  try {
    const verified = await new CertificateService().verifyPublicCertificate(req.params.number);
    if (!verified.isValid) throw new ForbiddenError('Certificate has been revoked');
    const cert = db.certificates.find(c => c.certificateNumber === req.params.number)!;
    const response = await fetch(`${config.analyticsServiceUrl}/api/v1/utilities/render-certificate`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', 'X-Internal-Key': config.internalServiceKey }, body: JSON.stringify({ certificate_id: cert.id, certificate_number: cert.certificateNumber, learner_id: cert.userId, learner_name: verified.learnerName, course_id: cert.courseId, course_title: verified.courseTitle, completion_date: cert.completionDate, issuer_name: cert.issuerName }) });
    if (!response.ok) throw new Error('Certificate rendering unavailable');
    const safeName = verified.learnerName.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Learner';
    res.attachment(`${safeName}_${cert.certificateNumber}.pdf`).type('application/pdf');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) { next(error); }
});
export default router;
