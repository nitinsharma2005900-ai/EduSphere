import request from 'supertest';
import { createApp } from '../src/app';
import { initializePersistence, pool } from '../src/database/persistence';
import { MemoryDataStore } from '../src/database/store';
const app = createApp();
const db = MemoryDataStore.getInstance();
beforeAll(async () => {
  if (!pool) throw new Error('Persistence integration tests require DATABASE_URL');
  await initializePersistence();
});
beforeEach(async () => { db.reset(); await pool!.query('UPDATE lms_state SET payload = $1::jsonb WHERE id = 1', [JSON.stringify(db.snapshot())]); });
afterAll(async () => { await pool?.end(); });

test('JSON POST completes and its login tokens are committed before responding', async () => {
  const response = await request(app).post('/api/v1/auth/login').send({ email: 'learner@edusphere.demo', password: 'EduSphere2026!' });
  expect(response.status).toBe(200);
  const state = (await pool!.query('SELECT payload FROM lms_state WHERE id = 1')).rows[0].payload;
  expect(state.refreshTokens.some((r: any) => r.token === response.body.data.tokens.refreshToken)).toBe(true);
});
test('progress survives resetting the in-process store and reloads from PostgreSQL', async () => {
  const response = await request(app).post('/api/v1/auth/login').send({ email: 'learner@edusphere.demo', password: 'EduSphere2026!' });
  const token = response.body.data.tokens.accessToken;
  const topic = db.topics.find(t => t.courseId === 'crs-fullstack-002')!;
  const lesson = db.lessons.find(l => l.topicId === topic.id)!;
  expect((await request(app).post(`/api/v1/enrollments/lessons/${lesson.id}/progress`).auth(token, { type: 'bearer' }).send({ isCompleted: true })).status).toBe(200);
  db.reset();
  const curriculum = await request(app).get('/api/v1/enrollments/crs-fullstack-002/curriculum').auth(token, { type: 'bearer' });
  expect(curriculum.body.data.topics[0].lessons[0].isCompleted).toBe(true);
});
test('concurrent duplicate registration is serialized to one persisted user', async () => {
  const data = { email: 'concurrent@example.com', password: 'StrongPass123!', firstName: 'Concurrent', lastName: 'Learner' };
  const responses = await Promise.all([request(app).post('/api/v1/auth/register').send(data), request(app).post('/api/v1/auth/register').send(data)]);
  expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
  const state = (await pool!.query('SELECT payload FROM lms_state WHERE id = 1')).rows[0].payload;
  expect(state.users.filter((u: any) => u.email === data.email)).toHaveLength(1);
});
