import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface SimpleAuthRequest extends Request {
  userId?: number;
  user?: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function simpleAuth(req: SimpleAuthRequest, res: Response, next: NextFunction) {
  // Check for session-based authentication first (most reliable)
  const sessionUser = (req as any).session?.user;
  console.log('SimpleAuth - Session check:', { sessionExists: !!(req as any).session, userExists: !!sessionUser, userId: sessionUser?.id });
  
  if (sessionUser && sessionUser.id) {
    req.userId = sessionUser.id;
    req.user = sessionUser;
    console.log('SimpleAuth - Session authenticated user:', sessionUser.id);
    return next();
  }
  
  // Check for Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  let token = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Check for token in cookies as fallback
  if (!token) {
    token = req.cookies?.auth_token;
  }
  
  // If we have a token, verify it
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.id;
      req.user = { id: decoded.id, email: decoded.email };
      return next();
    } catch (error: any) {
      console.log('Token verification failed for token:', token?.substring(0, 20) + '...', error?.message);
      // Token invalid, fall through to error
    }
  }
  
  // No valid authentication found
  console.log('Authentication failed - no valid token or session found. Headers:', {
    authorization: req.headers.authorization?.substring(0, 50) + '...',
    cookie: req.headers.cookie?.substring(0, 50) + '...',
    sessionExists: !!sessionUser
  });
  return res.status(401).json({ error: 'Access token required' });
}

export function optionalAuth(req: SimpleAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.id;
      req.user = { id: decoded.id, email: decoded.email };
    } catch (error) {
      // Token invalid, but continue without authentication
    }
  }
  
  next();
}