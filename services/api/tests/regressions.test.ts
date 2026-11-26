import request from 'supertest';
import { createApp } from '../src/app';
import { MemoryDataStore } from '../src/database/store';
const app = createApp();
const db = MemoryDataStore.getInstance();
const login = async (role = 'learner') => (await request(app).post('/api/v1/auth/login').send({ email: `${role}@edusphere.demo`, password: 'EduSphere2026!' })).body.data.tokens;
beforeEach(() => db.reset());

test.each(['learner', 'instructor', 'author', 'assessor', 'admin'])('%s role can sign in and retrieve its own profile', async role => {
  const tokens = await login(role);
  const profile = await request(app).get('/api/v1/auth/me').auth(tokens.accessToken, { type: 'bearer' });
  expect(profile.status).toBe(200);
  expect(profile.body.data.email).toBe(`${role}@edusphere.demo`);
});
test('public registration cannot create an administrator', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({ email: 'attacker@example.com', password: 'StrongPass123!', firstName: 'Test', lastName: 'User', role: 'ADMIN' });
  expect(response.status).toBe(400);
  expect(db.users.some(u => u.email === 'attacker@example.com')).toBe(false);
});
test('refresh rotation returns a new token that remains usable within the same second', async () => {
  const old = await login();
  const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: old.refreshToken });
  expect(refreshed.body.data.tokens.refreshToken).not.toBe(old.refreshToken);
  const again = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refreshed.body.data.tokens.refreshToken });
  expect(again.status).toBe(200);
});
test('zero-score grading persists a numeric zero', async () => {
  const tokens = await login();
  const response = await request(app).post('/api/v1/assessments/asm-crs-python-001/submit').auth(tokens.accessToken, { type: 'bearer' }).send({ answers: {} });
  expect(response.status).toBe(200);
  expect(response.body.data.score).toBe(0);
});
test('assessment eligibility is enforced before lessons are complete', async () => {
  const tokens = await login();
  const response = await request(app).post('/api/v1/assessments/asm-crs-fullstack-002/start').auth(tokens.accessToken, { type: 'bearer' });
  expect(response.status).toBe(403);
});
test('prerequisite and paid enrollment checks reject arbitrary input', async () => {
  const tokens = await login();
  const prerequisite = await request(app).post('/api/v1/enrollments/crs-sec-007/enroll').auth(tokens.accessToken, { type: 'bearer' }).send({ paymentToken: 'tok_sandbox_approved' });
  expect(prerequisite.status).toBe(403);
  const payment = await request(app).post('/api/v1/enrollments/crs-sql-003/enroll').auth(tokens.accessToken, { type: 'bearer' }).send({ paymentToken: 'arbitrary' });
  expect(payment.status).toBe(403);
});
test('starting an assessment twice returns one in-progress attempt', async () => {
  const tokens = await login();
  const first = await request(app).post('/api/v1/assessments/asm-crs-python-001/start').auth(tokens.accessToken, { type: 'bearer' });
  const second = await request(app).post('/api/v1/assessments/asm-crs-python-001/start').auth(tokens.accessToken, { type: 'bearer' });
  expect(first.status).toBe(201);
  expect(second.body.data.id).toBe(first.body.data.id);
});
test('invalid rubric scores cannot change a grade', async () => {
  const tokens = await login('assessor');
  const submission = db.assignmentSubmissions[0];
  const response = await request(app).post(`/api/v1/submissions/${submission.id}/grade`).auth(tokens.accessToken, { type: 'bearer' }).send({ score: 100, feedback: 'Invalid grade', rubricScores: { 'cr-arch': 100, 'cr-code': 0, 'cr-test': 0 } });
  expect(response.status).toBe(400);
  expect(submission.score).toBe(96);
});
test('certificate requires a passing capstone assignment', async () => {
  const tokens = await login();
  db.certificates = [];
  db.assignmentSubmissions[0].score = 20;
  const response = await request(app).post('/api/v1/certificates/courses/crs-python-001/claim').auth(tokens.accessToken, { type: 'bearer' });
  expect(response.status).toBe(403);
});
test('an author cannot change course ownership through mass assignment', async () => {
  const tokens = await login('author');
  const response = await request(app).put('/api/v1/courses/crs-python-001').auth(tokens.accessToken, { type: 'bearer' }).send({ authorId: 'usr-learner-001' });
  expect(response.status).toBe(400);
  expect(db.courses[0].authorId).toBe('usr-author-001');
});
test('learners cannot inspect another course cohort', async () => {
  const tokens = await login();
  const response = await request(app).get('/api/v1/analytics/cohort/crs-python-001').auth(tokens.accessToken, { type: 'bearer' });
  expect(response.status).toBe(403);
});

test('new learner earns a certificate under their own name and downloads a personalized PDF', async () => {
  const registration = await request(app).post('/api/v1/auth/register').send({ email: 'certificate-test@example.test', password: 'StrongPass123!', firstName: 'Taylor', lastName: 'Example' });
  expect(registration.status).toBe(201);
  const token = registration.body.data.tokens.accessToken;
  const author = (await login('author')).accessToken;
  const created = await request(app).post('/api/v1/courses').auth(author, { type: 'bearer' }).send({ title: 'Personal certificate test', description: 'Synthetic certificate workflow regression.', isPaid: false });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  const topic = await request(app).post(`/api/v1/author/courses/${id}/topics`).auth(author, { type: 'bearer' }).send({ title: 'Test topic' });
  expect(topic.status).toBe(201);
  const lesson = await request(app).post(`/api/v1/author/courses/${id}/lessons`).auth(author, { type: 'bearer' }).send({ topicId: topic.body.data.id, title: 'Test lesson', type: 'TEXT', contentText: 'A synthetic lesson.' });
  expect(lesson.status).toBe(201);
  expect((await request(app).patch(`/api/v1/courses/${id}/status`).auth(author, { type: 'bearer' }).send({ status: 'PUBLISHED' })).status).toBe(200);
  expect((await request(app).post(`/api/v1/enrollments/${id}/enroll`).auth(token, { type: 'bearer' }).send({})).status).toBe(200);
  const claim = () => request(app).post(`/api/v1/certificates/courses/${id}/claim`).auth(token, { type: 'bearer' }).send({});
  expect((await claim()).status).toBe(403);
  expect((await request(app).post(`/api/v1/enrollments/lessons/${lesson.body.data.id}/progress`).auth(token, { type: 'bearer' }).send({ isCompleted: true })).status).toBe(200);
  const issued = await claim();
  expect(issued.status).toBe(201);
  const number = issued.body.data.certificateNumber;
  expect((await claim()).body.data.certificateNumber).toBe(number);
  expect(issued.body.data.metadata.learnerName).toBe('Taylor Example');
  const verify = await request(app).get(`/api/v1/certificates/verify/${number}`);
  expect(verify.body.data.learnerName).toBe('Taylor Example');
  const render = jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('%PDF-1.4\n%%EOF', { headers: { 'Content-Type': 'application/pdf' } }));
  try {
    const pdf = await request(app).get(`/api/v1/certificates/verify/${number}/pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.headers['content-disposition']).toContain('Taylor_Example_');
    expect(JSON.parse(String(render.mock.calls[0][1]?.body)).learner_name).toBe('Taylor Example');
  } finally { render.mockRestore(); }
});
test('unknown certificates return 404 instead of a fabricated PDF', async () => {
  const response = await request(app).get('/api/v1/certificates/verify/UNKNOWN-CERTIFICATE/pdf');
  expect(response.status).toBe(404);
});
