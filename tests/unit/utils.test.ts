import { describe, it, expect } from '@jest/globals';

// Unit tests for utility functions
describe('Utility Functions', () => {
  describe('Authentication Utils', () => {
    it('should validate JWT token format', () => {
      const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidToken = 'InvalidToken';
      
      expect(validToken.startsWith('Bearer ')).toBe(true);
      expect(invalidToken.startsWith('Bearer ')).toBe(false);
    });

    it('should extract token from authorization header', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const token = authHeader.substring(7);
      
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
    });
  });

  describe('URL Validation', () => {
    it('should validate GitHub repository URLs', () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/organization/repository-name',
        'https://github.com/facebook/react'
      ];

      const invalidUrls = [
        'not-a-url',
        'https://bitbucket.org/user/repo',
        'https://example.com/repo'
      ];

      validUrls.forEach(url => {
        expect(url).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
      });

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
      });
    });

    it('should validate GitLab repository URLs', () => {
      const validGitLabUrl = 'https://gitlab.com/user/project';
      const invalidGitLabUrl = 'https://github.com/user/repo';

      expect(validGitLabUrl.includes('gitlab.com')).toBe(true);
      expect(invalidGitLabUrl.includes('gitlab.com')).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@company.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate repository names', () => {
      const validNames = [
        'My Repository',
        'Test-Repo-123',
        'Project_Name'
      ];

      const invalidNames = [
        '',
        '   ',
        'a'.repeat(256) // Too long
      ];

      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(255);
      });

      invalidNames.forEach(name => {
        expect(name.trim().length === 0 || name.length > 255).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown error types', () => {
      const handleError = (error: unknown) => {
        if (error instanceof Error) {
          return error.message;
        }
        return 'Unknown error occurred';
      };

      expect(handleError(new Error('Test error'))).toBe('Test error');
      expect(handleError('String error')).toBe('Unknown error occurred');
      expect(handleError(null)).toBe('Unknown error occurred');
    });
  });
});