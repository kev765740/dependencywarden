/**
 * Production Error Handling System
 * Comprehensive error management for production deployment
 */

import React from 'react';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorContext {
  userId?: string;
  route?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

// Enhanced error logging
export class ProductionErrorLogger {
  private static instance: ProductionErrorLogger;

  static getInstance(): ProductionErrorLogger {
    if (!ProductionErrorLogger.instance) {
      ProductionErrorLogger.instance = new ProductionErrorLogger();
    }
    return ProductionErrorLogger.instance;
  }

  logError(error: Error, context?: Partial<ErrorContext>, errorInfo?: ErrorInfo): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      errorInfo
    };

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Production Error:', errorData);
    }

    // Send to error tracking service in production
    this.sendToErrorService(errorData);
  }

  private async sendToErrorService(errorData: any): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
        credentials: 'include'
      });
    } catch (err) {
      console.error('Failed to send error to service:', err);
    }
  }
}

// Retry logic with exponential backoff
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          ProductionErrorLogger.getInstance().logError(lastError, {
            route: window.location.pathname
          });
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private maxFailures = 5,
    private timeout = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
    }
  }
}

// Global error boundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ProductionErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    ProductionErrorLogger.getInstance().logError(error, {
      route: window.location.pathname
    }, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error });
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  React.createElement('div', {
    className: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'
  }, [
    React.createElement('div', {
      key: 'error-content',
      className: 'max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6'
    }, [
      React.createElement('div', {
        key: 'icon',
        className: 'w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4'
      }, '⚠️'),
      React.createElement('h1', {
        key: 'title',
        className: 'text-xl font-semibold text-gray-900 dark:text-white text-center mb-2'
      }, 'Something went wrong'),
      React.createElement('p', {
        key: 'message',
        className: 'text-gray-600 dark:text-gray-400 text-center mb-4'
      }, 'We apologize for the inconvenience. Please try refreshing the page.'),
      React.createElement('button', {
        key: 'reload-btn',
        className: 'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors',
        onClick: () => window.location.reload()
      }, 'Reload Page')
    ])
  ])
);

export const errorLogger = ProductionErrorLogger.getInstance();
export const circuitBreaker = new CircuitBreaker();