/**
 * Production Security Configuration
 * Enhanced security measures for production deployment
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Session timeout configuration
export const SESSION_CONFIG = {
  maxAge: process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 24h prod, 7d dev
  rolling: true, // Reset expiry on activity
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const
};

// Permissive CORS configuration for development
export const getCorsOptions = () => {
  return {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  };
};

// Enhanced helmet configuration for production
export const getHelmetConfig = () => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://app.posthog.com", 
        "https://js.sentry-cdn.com",
        "https://js.stripe.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "blob:"
      ],
      connectSrc: [
        "'self'", 
        "https://app.posthog.com", 
        "https://sentry.io", 
        "https://api.github.com",
        "https://api.stripe.com",
        "wss:", 
        "ws:"
      ],
      frameSrc: [
        "'self'", 
        "https://js.stripe.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  crossOriginEmbedderPolicy: false
});

// Rate limiting configurations
export const createRateLimiters = () => ({
  api: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50') : 1000,
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
      limit: process.env.NODE_ENV === 'production' ? 50 : 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/health' || 
             req.path.startsWith('/assets') || 
             req.path.startsWith('/docs') ||
             req.path === '/api/health';
    },
    keyGenerator: (req) => {
      // Use IP + User-Agent for better rate limiting
      return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
    },
    onLimitReached: (req, res, options) => {
      console.warn(`[RATE LIMIT] IP ${req.ip} exceeded API rate limit`);
    }
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 
      parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5') : 50,
    message: {
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes",
      remainingAttempts: 0
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      // More specific rate limiting for auth attempts
      const email = req.body?.email || '';
      return `auth-${req.ip}-${email}`;
    },
    onLimitReached: (req, res, options) => {
      console.warn(`[AUTH RATE LIMIT] Suspicious activity from IP ${req.ip} - Email: ${req.body?.email || 'unknown'}`);
    }
  }),

  scan: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 
      parseInt(process.env.RATE_LIMIT_SCAN_MAX || '3') : 100,
    message: {
      error: "Too many scan requests, please try again later.",
      retryAfter: "1 hour",
      dailyLimit: 3
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // User-specific scan limiting
      const userId = req.user?.id || req.ip;
      return `scan-${userId}`;
    },
    onLimitReached: (req, res, options) => {
      console.warn(`[SCAN RATE LIMIT] User ${req.user?.id || req.ip} exceeded scan limit`);
    }
  }),

  publicApi: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 30 : 100,
    message: {
      error: "Too many requests to public API, please try again later.",
      retryAfter: "1 minute"
    },
    standardHeaders: true,
    legacyHeaders: false
  })
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Input validation and sanitization
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove null bytes
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body).replace(/\0/g, ''));
  }
  
  // Validate content length
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  next();
};

// API versioning and deprecation headers
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  const apiVersion = req.get('API-Version') || '1.0';
  res.setHeader('API-Version', '1.0');
  
  // Handle deprecated endpoints
  if (req.path.includes('/v0/')) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
  }
  
  next();
};

// Enhanced security audit logging
export const securityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const sensitiveEndpoints = ['/api/auth', '/api/login', '/api/register', '/api/admin'];
  const timestamp = new Date().toISOString();
  
  if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    const logEntry = {
      timestamp,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      contentLength: req.get('Content-Length'),
      sessionId: (req as any).sessionID
    };
    
    console.log(`[SECURITY AUDIT] ${JSON.stringify(logEntry)}`);
  }
  
  // Log failed authentication attempts
  res.on('finish', () => {
    if (req.path.includes('/auth') && res.statusCode >= 400) {
      console.log(`[AUTH FAILURE] ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${req.ip}`);
    }
  });
  
  next();
};

// Additional security middleware for production
export const productionSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Block requests with suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g,  // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JS injection
    /vbscript:/gi, // VBS injection
    /onload=/gi, // Event handler injection
    /onerror=/gi // Error handler injection
  ];
  
  const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      console.log(`[SECURITY BLOCK] Suspicious request blocked - IP: ${req.ip} - Pattern: ${pattern}`);
      return res.status(403).json({ error: 'Request blocked for security reasons' });
    }
  }
  
  next();
};

// Rate limit exceeded handler
export const rateLimitHandler = (req: Request, res: Response) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    path: req.path,
    userAgent: req.get('User-Agent'),
    message: 'Rate limit exceeded'
  };
  
  console.log(`[RATE LIMIT] ${JSON.stringify(logEntry)}`);
  
  res.status(429).json({
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  });
};