import DOMPurify from 'dompurify';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  customValidator?: (value: string) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class InputSanitizer {
  // Sanitize HTML content
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Sanitize plain text (remove HTML tags and special characters)
  static sanitizeText(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
      .trim();
  }

  // Sanitize email
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^a-zA-Z0-9@._-]/g, '');
  }

  // Sanitize URL
  static sanitizeUrl(url: string): string {
    try {
      const sanitized = url.trim();
      // Only allow http/https protocols
      if (sanitized.match(/^https?:\/\//)) {
        return sanitized;
      }
      return '';
    } catch {
      return '';
    }
  }

  // Validate input based on rules
  static validate(value: string, rules: ValidationRule): ValidationResult {
    if (rules.required && (!value || value.trim() === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Invalid format' };
    }

    if (value && rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return { isValid: false, error: 'Invalid email format' };
      }
    }

    if (value && rules.url) {
      try {
        new URL(value);
      } catch {
        return { isValid: false, error: 'Invalid URL format' };
      }
    }

    if (value && rules.customValidator && !rules.customValidator(value)) {
      return { isValid: false, error: 'Validation failed' };
    }

    return { isValid: true };
  }

  // Sanitize and validate form data
  static sanitizeAndValidate(data: Record<string, any>, rules: Record<string, ValidationRule>): {
    sanitizedData: Record<string, any>;
    errors: Record<string, string>;
    isValid: boolean;
  } {
    const sanitizedData: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Sanitize based on field type
        if (key.includes('email')) {
          sanitizedData[key] = this.sanitizeEmail(value);
        } else if (key.includes('url')) {
          sanitizedData[key] = this.sanitizeUrl(value);
        } else {
          sanitizedData[key] = this.sanitizeText(value);
        }

        // Validate if rules exist
        if (rules[key]) {
          const validation = this.validate(sanitizedData[key], rules[key]);
          if (!validation.isValid && validation.error) {
            errors[key] = validation.error;
          }
        }
      } else {
        sanitizedData[key] = value;
      }
    }

    return {
      sanitizedData,
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }
}

// CSRF Protection implementation
export class CSRFProtection {
  private static readonly CSRF_TOKEN_KEY = 'csrf_token';
  private static readonly TOKEN_EXPIRY_HOURS = 2;

  static async getToken(): Promise<string> {
    try {
      // Check if we have a valid cached token
      const cached = this.getCachedToken();
      if (cached && this.isTokenValid(cached)) {
        return cached.token;
      }

      // Request new token from server
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const data = await response.json();
      const token = data.csrfToken;

      // Cache the token
      this.cacheToken(token);
      return token;
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
      // Return a fallback token or throw
      throw new Error('CSRF token unavailable');
    }
  }

  private static getCachedToken(): { token: string; timestamp: number } | null {
    try {
      const cached = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private static isTokenValid(cached: { token: string; timestamp: number }): boolean {
    const now = Date.now();
    const maxAge = this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    return (now - cached.timestamp) < maxAge;
  }

  private static cacheToken(token: string): void {
    try {
      const cached = {
        token,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.CSRF_TOKEN_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache CSRF token:', error);
    }
  }

  static clearToken(): void {
    try {
      sessionStorage.removeItem(this.CSRF_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear CSRF token:', error);
    }
  }
}

// Test for XSS patterns - Enhanced detection
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<link[\s\S]*?>/gi,
    /<meta[\s\S]*?>/gi,
    /&lt;script/gi,
    /&lt;\/script/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// XSS Testing function for development
export function testXSSProtection(): boolean {
  const testPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '&lt;script&gt;alert("XSS")&lt;/script&gt;'
  ];

  return testPayloads.every(payload => {
    const sanitized = InputSanitizer.sanitizeText(payload);
    return !detectXSS(sanitized) && sanitized !== payload;
  });
}

function sanitizeInput(payload: string): string {
    return InputSanitizer.sanitizeText(payload);
}

// Zod validation schemas for secure input handling
import { z } from 'zod';

export const secureValidationSchemas = {
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  url: z.string().url('Invalid URL format'),
  text: z.string().min(1, 'Text is required').max(1000, 'Text too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
};

export const csrfProtection = CSRFProtection;
export default InputSanitizer;