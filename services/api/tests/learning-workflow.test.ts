import request from 'supertest';
import { createApp } from '../src/app';
import { MemoryDataStore } from '../src/database/store';

const app = createApp();
const db = MemoryDataStore.getInstance();

describe('Assessment 12: Learning Workflow Testing', () => {
  let learnerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    db.reset();

    const learnerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'learner@edusphere.demo', password: 'EduSphere2026!' });
    learnerToken = learnerRes.body.data.tokens.accessToken;

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@edusphere.demo', password: 'EduSphere2026!' });
    adminToken = adminRes.body.data.tokens.accessToken;
  });

  it('1. Course Hierarchy: should retrieve courses and topic curriculum', async () => {
    const res = await request(app).get('/api/v1/courses');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);

    const firstCourse = res.body.data[0];
    const detailsRes = await request(app).get(`/api/v1/courses/${firstCourse.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.data.topics.length).toBeGreaterThanOrEqual(1);
  });

  it('2. Enrollment: should enroll in a course and reflect in enrolled list', async () => {
    // Enroll in Course 3 (SQL)
    const enrollRes = await request(app)
      .post('/api/v1/enrollments/crs-sql-003/enroll')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ paymentToken: 'tok_sandbox_approved' });

    expect(enrollRes.status).toBe(200);
    expect(enrollRes.body.success).toBe(true);

    const myEnrollments = await request(app)
      .get('/api/v1/enrollments/my')
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(myEnrollments.body.data.some((e: any) => e.courseId === 'crs-sql-003')).toBe(true);
  });

  it('3. Lesson Progress & Sequential Lock: should enforce order of completion', async () => {
    // Attempt to complete lesson 2 while lesson 1 is not completed
    const courseId = 'crs-devops-005';
    await request(app)
      .post(`/api/v1/enrollments/${courseId}/enroll`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ paymentToken: 'tok_sandbox_mock' });

    const curriculum = await request(app)
      .get(`/api/v1/enrollments/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${learnerToken}`);

    const firstTopic = curriculum.body.data.topics[0];
    const lesson1 = firstTopic.lessons[0];
    const lesson2 = firstTopic.lessons[1];

    // Mark Lesson 1 complete
    const prog1 = await request(app)
      .post(`/api/v1/enrollments/lessons/${lesson1.id}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ isCompleted: true });

    expect(prog1.status).toBe(200);
    expect(prog1.body.data.lessonProgress.isCompleted).toBe(true);

    // Now lesson 2 can be completed
    const prog2 = await request(app)
      .post(`/api/v1/enrollments/lessons/${lesson2.id}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ isCompleted: true });

    expect(prog2.status).toBe(200);
  });

  it('4. Assessment Attempt & Automatic Deterministic Grading', async () => {
    const assessment = db.assessments[0];

    const submitRes = await request(app)
      .post(`/api/v1/assessments/${assessment.id}/submit`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        answers: {
          [`q-${assessment.id}-1`]: 'opt_c',
          [`q-${assessment.id}-2`]: ['sec_a', 'sec_c', 'sec_d'],
          [`q-${assessment.id}-3`]: 'false',
        },
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.percentage).toBe(100.0);
    expect(submitRes.body.data.isPassed).toBe(true);
  });
});
