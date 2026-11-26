import request from 'supertest';
import { createApp } from '../src/app';
import { MemoryDataStore } from '../src/database/store';

const app = createApp();
const db = MemoryDataStore.getInstance();

describe('Assessment 04 & 02: Authentication & Authorization APIs', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new learner and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newstudent@edusphere.demo',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newstudent@edusphere.demo');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'learner@edusphere.demo', // already in seed
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject weak passwords failing complexity rules', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weakpass@edusphere.demo',
          password: 'weak',
          firstName: 'Weak',
          lastName: 'Pass',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login & Token Rotation', () => {
    it('should authenticate valid credentials and issue tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'learner@edusphere.demo',
          password: 'EduSphere2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('LEARNER');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'learner@edusphere.demo',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should support refresh token rotation and revoke old token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'learner@edusphere.demo',
          password: 'EduSphere2026!',
        });

      const oldRefresh = loginRes.body.data.tokens.refreshToken;

      // Refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
      const newRefresh = refreshRes.body.data.tokens.refreshToken;

      // Old refresh token must now be revoked and rejected
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh });

      expect(replayRes.status).toBe(401);
    });
  });
});
