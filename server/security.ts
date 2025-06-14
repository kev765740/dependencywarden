import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import type { Session } from 'express-session';

interface CustomSession extends Session {
  csrfToken?: string;
}

interface CustomRequest extends Request {
  session: CustomSession;
}

// Enhanced security configuration
export function setupSecurityMiddleware(app: Express) {
  // Basic security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  // CSRF protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET requests and test environment
    if (req.method === 'GET' || process.env.NODE_ENV === 'test') {
      return next();
    }

    const token = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
  });

  // CSRF token endpoint
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    const token = crypto.randomBytes(32).toString('hex');
    if (req.session) {
      req.session.csrfToken = token;
    }
    res.json({ token });
  });
}

// Enhanced CSRF protection
export function setupCSRFProtection(app: Express) {
  // Generate CSRF token
  const generateCSRFToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
  };

  // CSRF middleware
  const csrfMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
    // Skip CSRF for GET requests and health checks
    if (req.method === 'GET' || req.path.startsWith('/health')) {
      return next();
    }

    // Skip CSRF for webhook endpoints (they have their own validation)
    if (req.path.includes('/webhook')) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._token;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'CSRF_INVALID'
      });
      return;
    }

    next();
  };

  app.use('/api', csrfMiddleware);

  // Endpoint to get CSRF token
  app.get('/api/csrf-token', (req: CustomRequest, res: Response) => {
    const token = generateCSRFToken();
    req.session.csrfToken = token;
    res.json({ csrfToken: token });
  });
}

// Data encryption utilities
export class DataEncryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  next();
}

// Input validation and sanitization
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Basic input sanitization
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}