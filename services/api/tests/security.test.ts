import request from 'supertest';
import { createApp } from '../src/app';
import { MemoryDataStore } from '../src/database/store';

const app = createApp();
const db = MemoryDataStore.getInstance();

describe('Capstone Domain-Specific Challenge: Security Regression Tests', () => {
  let learnerToken: string;
  let instructorToken: string;
  let assessorToken: string;
  let adminToken: string;

  beforeEach(async () => {
    db.reset();

    const lRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'learner@edusphere.demo', password: 'EduSphere2026!' });
    learnerToken = lRes.body.data.tokens.accessToken;

    const iRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'instructor@edusphere.demo', password: 'EduSphere2026!' });
    instructorToken = iRes.body.data.tokens.accessToken;

    const asRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'assessor@edusphere.demo', password: 'EduSphere2026!' });
    assessorToken = asRes.body.data.tokens.accessToken;

    const aRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@edusphere.demo', password: 'EduSphere2026!' });
    adminToken = aRes.body.data.tokens.accessToken;
  });

  it('SECURITY TEST 1: Learner must NOT be able to unlock restricted lessons by skipping prerequisites', async () => {
    const courseId = 'crs-sec-007';
    db.enrollments.find(e => e.userId === 'usr-learner-001' && e.courseId === 'crs-fullstack-002')!.status = 'COMPLETED' as any;
    await request(app)
      .post(`/api/v1/enrollments/${courseId}/enroll`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ paymentToken: 'tok_sandbox_test' });

    // Try to mark Lesson 2 complete directly without completing Lesson 1
    const topics = db.topics.filter(t => t.courseId === courseId);
    const lessons = db.lessons.filter(l => l.topicId === topics[0].id);
    const lesson2 = lessons[1];

    const bypassAttempt = await request(app)
      .post(`/api/v1/enrollments/lessons/${lesson2.id}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ isCompleted: true });

    // Must be rejected with 403 Forbidden!
    expect(bypassAttempt.status).toBe(403);
    expect(bypassAttempt.body.success).toBe(false);
    expect(bypassAttempt.body.error.code).toBe('FORBIDDEN');
    expect(bypassAttempt.body.error.message).toContain('Sequential learning restriction');
  });

  it('SECURITY TEST 2: Learner must NOT exceed assessment attempt limits', async () => {
    const courseId = 'crs-python-001';
    const assessment = db.assessments.find(a => a.courseId === courseId)!;

    // Reset attempts count to maxAttempts (3)
    db.assessmentAttempts = db.assessmentAttempts.filter(att => att.assessmentId !== assessment.id);

    // Make 3 attempts
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post(`/api/v1/assessments/${assessment.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ answers: {} });
    }

    // 4th attempt must be rejected by backend server-side validation!
    const fourthAttempt = await request(app)
      .post(`/api/v1/assessments/${assessment.id}/start`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({});

    expect(fourthAttempt.status).toBe(403);
    expect(fourthAttempt.body.success).toBe(false);
    expect(fourthAttempt.body.error.code).toBe('FORBIDDEN');
    expect(fourthAttempt.body.error.message).toContain('Attempt limit exceeded');
  });

  it('SECURITY TEST 3: Learner must NOT alter their own grades or grade submissions', async () => {
    const assignment = db.assignments[0];
    const submission = db.assignmentSubmissions[0];

    // Learner attempts to modify grade directly via API
    const gradeTamperAttempt = await request(app)
      .post(`/api/v1/submissions/${submission.id}/grade`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        score: 100.0,
        feedback: 'Hacked full marks',
        rubricScores: { 'cr-arch': 30, 'cr-code': 30, 'cr-test': 40 },
      });

    // Must be blocked with 403 Forbidden
    expect(gradeTamperAttempt.status).toBe(403);
    expect(gradeTamperAttempt.body.success).toBe(false);
  });

  it('SECURITY TEST 4: Learner must NOT issue an unauthorized certificate without fulfilling requirements', async () => {
    // Course 2 (Full Stack) is only 40% completed by learner in seed data
    const prematureClaim = await request(app)
      .post(`/api/v1/certificates/courses/crs-fullstack-002/claim`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({});

    // Must be strictly blocked!
    expect(prematureClaim.status).toBe(403);
    expect(prematureClaim.body.success).toBe(false);
    expect(prematureClaim.body.error.message).toContain('Certificate Eligibility Requirement Not Met');
  });

  it('SECURITY TEST 5: Assessment answers must NEVER be leaked to learners prior to submission', async () => {
    const assessment = db.assessments[0];

    // Learner fetches assessment
    const res = await request(app)
      .get(`/api/v1/assessments/${assessment.id}`)
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    const questions = res.body.data.questions;
    questions.forEach((q: any) => {
      expect(q.correctAnswers).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    });
  });
});
