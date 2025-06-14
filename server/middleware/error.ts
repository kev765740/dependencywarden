import { Request, Response, NextFunction, Express } from 'express';

export function setupErrorHandlers(app: Express) {
  // Handle JSON parsing errors
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    next(err);
  });

  // Handle 404 errors
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith('/api/repos/')) {
      res.status(404).json({ error: 'Repository not found' });
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (err.name === 'ForbiddenError') {
      return res.status(403).json({ error: err.message });
    }

    if (err.name === 'DuplicateError') {
      return res.status(409).json({ error: 'Repository already exists' });
    }

    // Default error response
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      details: err.details || 'Unknown error'
    });
  });
} 