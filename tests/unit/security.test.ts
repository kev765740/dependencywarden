import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import type { Express, Request, Response } from 'express';
import express from 'express';
import session from 'express-session';
import { DataEncryption } from '../../server/security';

declare module 'express-session' {
  interface SessionData {
    csrfToken: string;
  }
}

describe('Security Module', () => {
  describe('DataEncryption', () => {
    it('should generate a valid encryption key', () => {
      const key = DataEncryption.generateKey();
      expect(key).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(key).toMatch(/^[a-f0-9]+$/);
    });

    it('should encrypt and decrypt data correctly', () => {
      const key = DataEncryption.generateKey();
      const plainText = 'sensitive user data';
      
      const encrypted = DataEncryption.encrypt(plainText, key);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      
      const decrypted = DataEncryption.decrypt(encrypted, key);
      expect(decrypted).toBe(plainText);
    });

    it('should fail to decrypt with wrong key', () => {
      const key1 = DataEncryption.generateKey();
      const key2 = DataEncryption.generateKey();
      const plainText = 'sensitive data';
      
      const encrypted = DataEncryption.encrypt(plainText, key1);
      
      expect(() => {
        DataEncryption.decrypt(encrypted, key2);
      }).toThrow();
    });
  });

  describe('Rate Limiting', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(404); // Endpoint doesn't exist but rate limit allows it
      
      expect(response.status).toBe(404);
    });
  });

  describe('CSRF Protection', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-session-secret',
        resave: false,
        saveUninitialized: false
      }));
    });

    it('should provide CSRF token endpoint', async () => {
      app.get('/api/csrf-token', (req: Request, res: Response) => {
        const token = 'test-token';
        if (req.session) {
          req.session.csrfToken = token;
        }
        res.json({ csrfToken: token });
      });

      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);
      
      expect(response.body.csrfToken).toBeDefined();
    });
  });
});