
import { Request, Response, NextFunction } from 'express';
import { captureException } from './sentry';

export interface ErrorRecoveryOptions {
  retryAttempts?: number;
  retryDelay?: number;
  fallbackResponse?: any;
  logLevel?: 'error' | 'warn' | 'info';
}

export class ErrorRecoveryMiddleware {
  static handleAsyncError(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
    options: ErrorRecoveryOptions = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const {
        retryAttempts = 0,
        retryDelay = 1000,
        fallbackResponse = { error: 'Service temporarily unavailable' },
        logLevel = 'error'
      } = options;

      let attempts = 0;
      
      const executeWithRetry = async (): Promise<any> => {
        try {
          return await fn(req, res, next);
        } catch (error: any) {
          attempts++;
          
          // Log error with context
          const errorContext = {
            method: req.method,
            path: req.path,
            attempt: attempts,
            userId: (req as any).user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          };

          console[logLevel](`[ERROR RECOVERY] ${error.message}`, errorContext);

          // Capture to Sentry
          captureException(error, {
            tags: {
              endpoint: req.path,
              method: req.method,
              attempt: attempts.toString(),
            },
            extra: errorContext,
            user: (req as any).user ? {
              id: (req as any).user.id,
              email: (req as any).user.email,
            } : undefined,
          });

          // Retry logic
          if (attempts <= retryAttempts && this.isRetryableError(error)) {
            console.warn(`[ERROR RECOVERY] Retrying in ${retryDelay}ms (attempt ${attempts}/${retryAttempts + 1})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
            return executeWithRetry();
          }

          // Final error handling
          if (!res.headersSent) {
            const statusCode = this.getStatusCode(error);
            const errorResponse = this.buildErrorResponse(error, fallbackResponse, req.path);
            return res.status(statusCode).json(errorResponse);
          }
          
          throw error;
        }
      };

      return executeWithRetry();
    };
  }

  private static isRetryableError(error: any): boolean {
    // Define which errors are worth retrying
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'NETWORK_ERROR',
      'DATABASE_CONNECTION_ERROR'
    ];

    return retryableErrors.some(retryableError => 
      error.code === retryableError || 
      error.message?.includes(retryableError) ||
      (error.status >= 500 && error.status < 600)
    );
  }

  private static getStatusCode(error: any): number {
    if (error.status) return error.status;
    if (error.statusCode) return error.statusCode;
    if (error.code === 'ENOTFOUND') return 502;
    if (error.code === 'ETIMEDOUT') return 504;
    if (error.code === 'ECONNREFUSED') return 503;
    return 500;
  }

  private static buildErrorResponse(error: any, fallbackResponse: any, path: string) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      ...fallbackResponse,
      message: isDevelopment ? error.message : fallbackResponse.error,
      timestamp: new Date().toISOString(),
      path,
      ...(isDevelopment && { stack: error.stack, details: error })
    };
  }

  // Middleware for global error handling
  static globalErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    const errorContext = {
      errorId,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    };

    console.error(`[GLOBAL ERROR HANDLER] ${error.message}`, errorContext);

    // Capture to Sentry
    captureException(error, {
      tags: {
        errorId,
        endpoint: req.path,
        method: req.method,
        globalHandler: 'true'
      },
      extra: errorContext,
      user: (req as any).user ? {
        id: (req as any).user.id,
        email: (req as any).user.email,
      } : undefined,
    });

    if (!res.headersSent) {
      const statusCode = this.getStatusCode(error);
      const response = {
        error: 'Internal server error',
        errorId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          message: error.message,
          stack: error.stack
        })
      };
      
      res.status(statusCode).json(response);
    }
  }
}

// Export helper function for easy use
export const withErrorRecovery = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options?: ErrorRecoveryOptions
) => ErrorRecoveryMiddleware.handleAsyncError(handler, options);
