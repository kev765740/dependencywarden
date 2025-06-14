/**
 * Production Security Implementation
 * Comprehensive security layer for production deployment
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Enhanced input sanitization
export const sanitizeInput = {
  text: (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      .replace(/[<>'"&]/g, '')
      .trim();
  },

  html: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  },

  email: (email: string): string => {
    const cleaned = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : '';
  },

  url: (url: string): string => {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }
};

// Validation schemas for production
export const productionSchemas = {
  user: z.object({
    email: z.string().email().transform(sanitizeInput.email),
    firstName: z.string().min(1).max(50).transform(sanitizeInput.text),
    lastName: z.string().min(1).max(50).transform(sanitizeInput.text),
    password: z.string().min(8).max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/)
  }),

  repository: z.object({
    name: z.string().min(1).max(100).transform(sanitizeInput.text),
    url: z.string().url().transform(sanitizeInput.url),
    description: z.string().max(500).transform(sanitizeInput.text).optional()
  }),

  feedback: z.object({
    message: z.string().min(1).max(1000).transform(sanitizeInput.text),
    rating: z.number().min(1).max(5),
    email: z.string().email().transform(sanitizeInput.email).optional()
  })
};

// CSRF Protection
export class SecurityManager {
  private static instance: SecurityManager;
  private csrfToken: string | null = null;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  async getCSRFToken(): Promise<string> {
    if (!this.csrfToken) {
      try {
        const response = await fetch('/api/csrf-token', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          this.csrfToken = data.token;
        }
      } catch (error) {
        console.error('CSRF token fetch failed:', error);
      }
    }
    return this.csrfToken || '';
  }

  validateCSRFToken(token: string): boolean {
    return Boolean(token && token.length >= 32 && /^[a-zA-Z0-9]+$/.test(token));
  }

  // Rate limiting helper
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string, maxRequests = 100, windowMs = 900000): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      this.requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }
}

// XSS Prevention
export const preventXSS = {
  sanitizeForDisplay: (content: string): string => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  },

  escapeHtml: (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

export const securityManager = SecurityManager.getInstance();