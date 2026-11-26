import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { MemoryDataStore } from '../database/store';
import { requireCourseAccess } from '../services/access';
import { UserRole, LessonType, QuestionType } from '@edusphere/shared';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = Router();
const db = MemoryDataStore.getInstance();
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.COURSE_AUTHOR, UserRole.INSTRUCTOR));
router.get('/courses', (req, res) => res.json({ success: true, data: db.courses.filter(c => req.user!.role === 'ADMIN' || c.authorId === req.user!.userId || c.instructorId === req.user!.userId) }));
router.get('/courses/:id', (req, res, next) => {
  try {
    const course = requireCourseAccess(req.params.id, req.user!.userId, true);
    const topics = db.topics.filter(t => t.courseId === course.id).sort((a,b) => a.orderIndex-b.orderIndex);
    res.json({ success: true, data: { ...course, topics: topics.map(t => ({ ...t, lessons: db.lessons.filter(l => l.topicId === t.id), assessments: db.assessments.filter(a => a.topicId === t.id), assignments: db.assignments.filter(a => a.topicId === t.id) })) } });
  } catch (error) { next(error); }
});
router.post('/courses/:id/:kind', (req, res, next) => {
  try {
    const course = requireCourseAccess(req.params.id, req.user!.userId, true);
    const now = new Date().toISOString();
    const base = { id: randomUUID(), createdAt: now, updatedAt: now };
    const title = z.string().trim().min(3).max(200).parse(req.body.title);
    let record: unknown;
    if (req.params.kind === 'topics') {
      record = { ...base, courseId: course.id, title, description: '', orderIndex: db.topics.filter(t => t.courseId === course.id).length + 1 };
      db.topics.push(record as any);
    } else {
      const topic = db.topics.find(t => t.id === req.body.topicId && t.courseId === course.id);
      if (!topic) throw new NotFoundError('Choose a module from this course');
      if (req.params.kind === 'lessons') {
        const input = z.object({ type: z.nativeEnum(LessonType), videoUrl: z.string().url().optional(), contentText: z.string().max(100000).optional() }).parse(req.body);
        if (input.type === LessonType.VIDEO && (!input.videoUrl || !input.videoUrl.startsWith('https://'))) throw new ValidationError('Video lessons require an HTTPS URL');
        if (input.type === LessonType.TEXT && !input.contentText?.trim()) throw new ValidationError('Text lesson content is required');
        record = { ...base, ...input, topicId: topic.id, title, slug: base.id, description: '', durationSeconds: 300, orderIndex: db.lessons.filter(l => l.topicId === topic.id).length + 1, isPreview: false, isMandatory: true, resources: [] };
        db.lessons.push(record as any);
      } else if (req.params.kind === 'assessments') {
        const input = z.object({ prompt: z.string().trim().min(3).max(3000), options: z.array(z.string().min(1).max(1000)).min(2).max(10), correctIndex: z.number().int().nonnegative(), maxAttempts: z.number().int().min(1).max(10).default(3) }).parse(req.body);
        if (input.correctIndex >= input.options.length) throw new ValidationError('Choose the correct answer');
        record = { ...base, courseId: course.id, topicId: topic.id, title, durationMinutes: 20, passingScore: 70, maxAttempts: input.maxAttempts, isStrictSequential: true, version: 1, questions: [{ id: randomUUID(), assessmentId: base.id, prompt: input.prompt, type: QuestionType.SINGLE_CHOICE, points: 10, orderIndex: 1, options: input.options.map((text, index) => ({ id: String(index), text })), correctAnswers: [String(input.correctIndex)] }] };
        db.assessments.push(record as any);
      } else if (req.params.kind === 'assignments') {
        const instructions = z.string().trim().min(5).max(20000).parse(req.body.instructions);
        record = { ...base, courseId: course.id, topicId: topic.id, title, instructions, maxScore: 100, allowedFileTypes: ['pdf','zip','docx'], maxFileSizeMb: 10, rubricCriteria: [{ id: 'cr-arch', title: 'Architecture & System Design', description: 'Design and requirements', maxPoints: 30 }, { id: 'cr-code', title: 'Code Quality & Formatting', description: 'Implementation quality', maxPoints: 30 }, { id: 'cr-test', title: 'Test Coverage & Correctness', description: 'Correctness and evidence', maxPoints: 40 }] };
        db.assignments.push(record as any);
      } else throw new NotFoundError('Content type not found');
    }
    course.version += 1;
    course.updatedAt = now;
    db.auditLogs.push({ id: randomUUID(), userId: req.user!.userId, userRole: req.user!.role, action: 'COURSE_CONTENT_CREATED', entity: req.params.kind, entityId: (record as any).id, details: { courseId: course.id, version: course.version }, timestamp: now });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
});
export default router;
