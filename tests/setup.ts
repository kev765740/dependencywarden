import { jest } from '@jest/globals';
import { TestFactory } from './utils/factories';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.SLACK_TOKEN = 'test-slack-token';
process.env.SENTRY_DSN = 'test-sentry-dsn';

// Mock fetch globally
global.fetch = jest.fn();

// Mock external services
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      get: jest.fn().mockImplementation(async ({ owner, repo }) => ({
        data: TestFactory.createGitHubRepo({ owner: { login: owner }, name: repo })
      })),
      listForUser: jest.fn().mockResolvedValue({ data: [] })
    }
  }))
}));

jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: {
      postMessage: jest.fn().mockResolvedValue({ ok: true })
    }
  }))
}));

// Mock database
const mockRepos = new Map();

jest.mock('../server/db/repositories', () => ({
  RepoModel: {
    find: jest.fn().mockImplementation(async (query) => {
      return Array.from(mockRepos.values())
        .filter(repo => repo.userId === query.userId);
    }),
    create: jest.fn().mockImplementation(async (data) => {
      // Check for case-insensitive duplicate
      const duplicate = Array.from(mockRepos.values())
        .find(repo => repo.userId === data.userId && 
          repo.url.toLowerCase() === data.url.toLowerCase());
      
      if (duplicate) {
        const error = new Error('Repository already exists');
        error.name = 'DuplicateError';
        throw error;
      }

      const repo = TestFactory.createRepository(data);
      mockRepos.set(repo.id, repo);
      return repo;
    }),
    findOne: jest.fn().mockImplementation(async (query) => {
      if (query._id) {
        return mockRepos.get(query._id) || null;
      }
      if (query.url) {
        const urlRegex = new RegExp(query.url.$regex || query.url, 'i');
        return Array.from(mockRepos.values())
          .find(repo => repo.userId === query.userId && urlRegex.test(repo.url)) || null;
      }
      return null;
    }),
    findByIdAndUpdate: jest.fn().mockImplementation(async (id, update) => {
      const repo = mockRepos.get(id);
      if (!repo) return null;

      const updatedRepo = {
        ...repo,
        ...(update.$set || {}),
        updatedAt: new Date()
      };
      mockRepos.set(id, updatedRepo);
      return updatedRepo;
    }),
    findByIdAndDelete: jest.fn().mockImplementation(async (id) => {
      const repo = mockRepos.get(id);
      if (!repo) return null;

      mockRepos.delete(id);
      return repo;
    })
  }
}));

// Mock OSV API
jest.mock('../server/services/osv', () => ({
  scanPackageVulnerabilities: jest.fn().mockImplementation(async () => 
    TestFactory.createOSVResponse()
  )
}));

// Mock notifications
jest.mock('../server/services/notifications', () => ({
  sendSlackNotification: jest.fn().mockResolvedValue(true),
  sendEmailNotification: jest.fn().mockResolvedValue(true)
}));

// Reset all mocks and data before each test
beforeEach(() => {
  jest.resetAllMocks();
  mockRepos.clear();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});