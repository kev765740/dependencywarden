import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import session from 'express-session';
import { TestFactory } from '../utils/factories';

// Import actual router and middleware
import { setupSecurityMiddleware } from '../../server/security';
import { repoRouter } from '../../server/routes/repositories';
import { setupErrorHandlers } from '../../server/middleware/error';
import { validateAuthToken } from '../../server/middleware/auth';
import { RepoModelMongoose as RepoModel } from '../../server/db/repositories';

// Mock external services
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      get: jest.fn().mockImplementation(async ({ owner, repo }) => ({
        data: TestFactory.createGitHubRepo({ owner: { login: owner }, name: repo })
      }))
    }
  }))
}));

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

jest.mock('../../server/services/notifications', () => ({
  sendSlackNotification: jest.fn().mockResolvedValue(true),
  sendEmailNotification: jest.fn().mockResolvedValue(true)
}));

describe('Repository Management API', () => {
  let app: Express;
  let csrfToken: string;
  const testUser = { id: 'test-user', email: 'test@example.com' };
  const testToken = 'test-token';
  let testRepo: any;

  beforeAll(async () => {
    jest.setTimeout(30000);

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true
    }));

    setupSecurityMiddleware(app);
    app.use('/api/repos', validateAuthToken);
    app.use('/api/repos', repoRouter);
    setupErrorHandlers(app);

    // Get CSRF token
    const response = await request(app)
      .get('/api/csrf-token')
      .expect(200);
    csrfToken = response.body.token;
  }, 30000);

  beforeEach(async () => {
    await RepoModel.deleteMany({});
    jest.clearAllMocks();
    testRepo = TestFactory.createRepository({ userId: testUser.id });
    await RepoModel.create(testRepo);
  });

  afterAll(async () => {
    await RepoModel.deleteMany({});
  });

  describe('POST /api/repos/add', () => {
    const validRepo = {
      url: 'https://github.com/user/repo',
      isPrivate: false
    };

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/repos/add')
        .set('x-csrf-token', csrfToken)
        .send(validRepo)
        .expect(401);

      expect(response.body.error).toBe('Authorization header is required');
    });

    it('should handle case-insensitive duplicate repos', async () => {
      // First create a repo
      await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send(validRepo);

      // Try to create the same repo with different case
      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          ...validRepo,
          url: validRepo.url.toUpperCase()
        })
        .expect(409);

      expect(response.body.error).toMatch(/already exists/i);
    });

    it('should handle private GitHub repositories', async () => {
      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({ ...validRepo, isPrivate: true })
        .expect(403);

      expect(response.body.error).toMatch(/private repository/i);
    });

    it('should validate GitHub repository URL format', async () => {
      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          ...validRepo,
          url: 'not-a-github-url'
        })
        .expect(400);

      expect(response.body.error).toMatch(/invalid.*url/i);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(RepoModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/repos/add')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send(validRepo)
        .expect(500);

      expect(response.body.error).toMatch(/failed to create/i);
    });
  });

  describe('PATCH /api/repos/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/repos/${testRepo.id}`)
        .set('x-csrf-token', csrfToken)
        .send({ slackChannel: '#new-channel' })
        .expect(401);

      expect(response.body.error).toBe('Authorization header is required');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .patch(`/api/repos/non-existent-id`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({ slackChannel: '#new-channel' })
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 403 for repository owned by another user', async () => {
      // Create a repo owned by another user
      const otherUserRepo = TestFactory.createRepository({ userId: 'other-user' });
      await RepoModel.create(otherUserRepo);

      const response = await request(app)
        .patch(`/api/repos/${otherUserRepo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({ slackChannel: '#new-channel' })
        .expect(403);

      expect(response.body.error).toMatch(/not authorized/i);
    });

    it('should validate input types', async () => {
      const response = await request(app)
        .patch(`/api/repos/${testRepo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({ isPrivate: 'not-a-boolean' })
        .expect(400);

      expect(response.body.error).toMatch(/invalid.*type/i);
    });

    it('should only update allowed fields', async () => {
      const response = await request(app)
        .patch(`/api/repos/${testRepo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .send({
          slackChannel: '#new-channel',
          owner: 'attempt-to-change-owner'
        })
        .expect(200);

      expect(response.body.id).toBe(testRepo.id);
      expect(response.body.owner).toBe(testRepo.owner);
      expect(response.body.slackChannel).toBe('#new-channel');
    });
  });

  describe('POST /api/repos/:id/scan', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('x-csrf-token', csrfToken)
        .expect(401);

      expect(response.body.error).toBe('Authorization header is required');
    });

    it('should call OSV API and store vulnerabilities', async () => {
      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'completed',
        vulnerabilitiesFound: 1,
        notificationsSent: true
      });
      expect(Array.isArray(response.body.vulnerabilities)).toBe(true);
      expect(response.body.vulnerabilities).toHaveLength(1);
    });

    it('should deduplicate vulnerabilities', async () => {
      // First scan
      await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      // Second scan should deduplicate
      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body.vulnerabilitiesFound).toBe(1);
    });

    it('should send notifications for critical vulnerabilities', async () => {
      // Update test repo to have notifications enabled
      testRepo.slackChannel = '#test-channel';
      testRepo.emailNotifications = true;
      await RepoModel.findByIdAndUpdate(testRepo.id, testRepo);

      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body.notificationsSent).toBe(true);
    });

    it('should handle OSV API errors gracefully', async () => {
      // Mock API error
      const scanPackageVulnerabilities = jest.requireMock('../../server/services/osv').scanPackageVulnerabilities;
      scanPackageVulnerabilities.mockRejectedValueOnce(new Error('OSV API error'));

      const response = await request(app)
        .post(`/api/repos/${testRepo.id}/scan`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(500);

      expect(response.body.error).toMatch(/scan failed/i);
      expect(response.body.details).toMatch(/osv api error/i);
    });
  });

  describe('DELETE /api/repos/:id', () => {
    it('should return 403 when deleting another user\'s repository', async () => {
      // Create a repo owned by another user
      const otherUserRepo = TestFactory.createRepository({ userId: 'other-user' });
      await RepoModel.create(otherUserRepo);

      const response = await request(app)
        .delete(`/api/repos/${otherUserRepo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(403);

      expect(response.body.error).toMatch(/not authorized/i);
    });

    it('should handle database constraint errors', async () => {
      // Mock database constraint error
      jest.spyOn(RepoModel, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Constraint error'));

      const response = await request(app)
        .delete(`/api/repos/${testRepo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(500);

      expect(response.body.error).toMatch(/failed to delete/i);
      expect(response.body.details).toMatch(/constraint/i);
    });
  });
});