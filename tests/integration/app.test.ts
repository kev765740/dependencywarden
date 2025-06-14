import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import type { Express } from 'express';
import { RepoModelMongoose as RepoModel } from '../../server/db/repositories';

// Import test utilities
import { mockRepos } from '../utils/test-utils';

// Import your actual routers and middleware
import { setupSecurityMiddleware } from '../../server/security';
import { authRouter } from '../../server/routes/auth';
import { repoRouter } from '../../server/routes/repositories';
import { setupErrorHandlers } from '../../server/middleware/error';

// Mock OSV service
jest.mock('../../server/services/osv', () => ({
  scanPackageVulnerabilities: jest.fn().mockImplementation(async () => ({
    vulns: [
      {
        id: 'TEST-123',
        summary: 'Test vulnerability',
        details: 'Test vulnerability details',
        severity: 'CRITICAL',
        package: {
          name: 'test-package',
          ecosystem: 'npm',
          version: '1.0.0'
        },
        affects: {
          ranges: [{
            type: 'SEMVER',
            events: [
              { introduced: '0.0.1' },
              { fixed: '1.0.1' }
            ]
          }]
        },
        published: new Date(),
        modified: new Date()
      }
    ]
  }))
}));

describe('Integration Tests', () => {
  let app: Express;
  let csrfToken: string;
  const testToken = 'test-token';

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true
    }));

    setupSecurityMiddleware(app);
    app.use('/api/auth', authRouter);
    app.use('/api/repos', repoRouter);
    setupErrorHandlers(app);

    // Get CSRF token
    const response = await request(app)
      .get('/api/csrf-token')
      .expect(200);
    csrfToken = response.body.token;
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/repos')
        .set('x-csrf-token', csrfToken)
        .expect(401);

      expect(response.body.error).toBe('Authorization header is required');
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/repos')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Repository Management', () => {
    let testRepo: any;

    beforeEach(async () => {
      await RepoModel.deleteMany({});
      // Create a test repository
      testRepo = await RepoModel.create({
        userId: 'test-user',
        url: 'https://github.com/test/repo',
        isPrivate: false,
        name: 'repo',
        owner: 'test'
      });
    });

    afterEach(async () => {
      await RepoModel.deleteMany({});
    });

    it('should list repositories', async () => {
      const response = await request(app)
        .get('/api/repos')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should scan repository dependencies', async () => {
      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toMatch(/invalid json/i);
    });

    it('should handle not found routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });
  });
}); 