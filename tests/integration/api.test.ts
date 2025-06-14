import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import express, { Express } from 'express';
import { setupSecurityMiddleware } from '../../server/security';
import { authRouter } from '../../server/routes/auth';
import { repoRouter } from '../../server/routes/repositories';
import { setupErrorHandlers } from '../../server/middleware/error';
import { validateAuthToken } from '../../server/middleware/auth';

describe('API Integration Tests', () => {
  let app: Express;
  const testToken = jwt.sign({ id: 'test-user' }, process.env.JWT_SECRET || 'test-secret');

  beforeEach(() => {
    app = express();
    app.use(express.json());
    setupSecurityMiddleware(app);
    app.use('/api/auth', authRouter);
    app.use('/api/repos', validateAuthToken, repoRouter);
    setupErrorHandlers(app);
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/repos/123')
        .expect(401);

      expect(response.body.error).toBe('Authorization header is required');
    });

    it('should accept valid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/repos/123')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404); // Should return 404 since repo doesn't exist

      expect(response.body.error).toBe('Repository not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toMatch(/invalid/i);
    });

    it('should handle route not found', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/repos/123')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(404) // Should return 404 since repo doesn't exist
      );

      await Promise.all(promises);
    });
  });
});