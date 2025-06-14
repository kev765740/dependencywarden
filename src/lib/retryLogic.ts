
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponential?: boolean;
  shouldRetry?: (error: any) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

// Default retry configuration
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  shouldRetry: (error: any) => {
    // Retry on network errors, 5xx status codes, and timeouts
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return true;
    }
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return true;
    }
    return false;
  }
};

// Exponential backoff with jitter
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, exponential: boolean): number {
  if (!exponential) {
    return Math.min(baseDelay, maxDelay);
  }
  
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  
  return Math.min(exponentialDelay + jitter, maxDelay);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generic retry function
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if we've reached max attempts
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Don't retry if the error is not retryable
      if (!config.shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay, config.exponential);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      await sleep(delay);
    }
  }
  
  throw new RetryError(
    `Failed after ${config.maxAttempts} attempts`,
    config.maxAttempts,
    lastError!
  );
}

// Retry wrapper for fetch requests
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Consider 4xx errors as non-retryable (except 408, 429)
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
        error.status = response.status;
        error.response = response;
        
        if (response.status >= 400 && response.status < 500 && 
            response.status !== 408 && response.status !== 429) {
          error.code = 'CLIENT_ERROR';
        } else {
          error.code = 'SERVER_ERROR';
        }
        
        throw error;
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as any;
        timeoutError.name = 'TimeoutError';
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      
      if (error.message.includes('fetch')) {
        error.name = 'NetworkError';
        error.code = 'NETWORK_ERROR';
      }
      
      throw error;
    }
  }, retryOptions);
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
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
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
}

// Request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Create global circuit breaker instance for API calls
export const apiCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s recovery

// Convenience wrapper for backward compatibility
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retry(fn, options);
}

// Export main functions
export default {
  retry,
  retryFetch,
  withRetry,
  CircuitBreaker,
  RetryError,
  requestDeduplicator,
  apiCircuitBreaker
};
