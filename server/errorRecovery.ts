/**
 * Comprehensive Error Recovery and Resilience Module
 * Handles external service failures, retries, and graceful degradation
 */

export class ErrorRecoveryManager {
  private retryAttempts = new Map<string, number>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  
  // Configure circuit breaker for external services
  constructor() {
    this.circuitBreakers.set('google-ai', new CircuitBreaker('google-ai', 5, 60000));
    this.circuitBreakers.set('github-api', new CircuitBreaker('github-api', 5, 60000));
    this.circuitBreakers.set('openai-api', new CircuitBreaker('openai-api', 3, 30000));
    this.circuitBreakers.set('sendgrid-api', new CircuitBreaker('sendgrid-api', 3, 30000));
    this.circuitBreakers.set('slack-api', new CircuitBreaker('slack-api', 3, 30000));
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(operationName);
    
    if (circuitBreaker?.isOpen()) {
      throw new Error(`Circuit breaker open for ${operationName}`);
    }

    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry counter on success
        this.retryAttempts.delete(operationName);
        circuitBreaker?.recordSuccess();
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Record failure in circuit breaker
        circuitBreaker?.recordFailure();
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await this.sleep(delay);
        
        console.warn(`Retry attempt ${attempt} for ${operationName} after ${delay}ms`);
      }
    }

    // Track total retry attempts
    const totalAttempts = (this.retryAttempts.get(operationName) || 0) + maxRetries;
    this.retryAttempts.set(operationName, totalAttempts);
    
    throw new Error(`Operation ${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryOperation, operationName, 2, 500);
    } catch (error) {
      console.warn(`Primary operation ${operationName} failed, using fallback:`, error);
      return await fallbackOperation();
    }
  }

  async executeWithGracefulDegradation<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    operationName: string
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation, operationName, 1, 1000);
    } catch (error) {
      console.warn(`Operation ${operationName} failed, using default value:`, error);
      return defaultValue;
    }
  }

  // Database operation with connection retry
  async executeDbOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'database'
  ): Promise<T> {
    return await this.executeWithRetry(
      operation,
      operationName,
      3, // Max retries for DB operations
      2000 // 2 second base delay
    );
  }

  // External API call with circuit breaker
  async executeExternalApiCall<T>(
    apiCall: () => Promise<T>,
    serviceName: string,
    fallbackValue?: T
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker?.isOpen()) {
      if (fallbackValue !== undefined) {
        console.warn(`Circuit breaker open for ${serviceName}, using fallback`);
        return fallbackValue;
      }
      throw new Error(`Service ${serviceName} is temporarily unavailable`);
    }

    try {
      return await this.executeWithRetry(apiCall, serviceName, 2, 1000);
    } catch (error) {
      if (fallbackValue !== undefined) {
        console.warn(`API call to ${serviceName} failed, using fallback:`, error);
        return fallbackValue;
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get recovery statistics
  getRecoveryStats() {
    const stats: any = {};
    
    const circuitBreakerEntries = Array.from(this.circuitBreakers.entries());
    for (const [service, breaker] of circuitBreakerEntries) {
      stats[service] = {
        failures: breaker.getFailureCount(),
        isOpen: breaker.isOpen(),
        retryAttempts: this.retryAttempts.get(service) || 0
      };
    }
    
    return stats;
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private name: string,
    private failureThreshold: number,
    private recoveryTimeout: number
  ) {}

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn(`Circuit breaker opened for ${this.name} after ${this.failures} failures`);
    }
  }

  isOpen(): boolean {
    if (this.state === 'closed') {
      return false;
    }
    
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    
    return false; // half-open allows one attempt
  }

  getFailureCount(): number {
    return this.failures;
  }
}

export const errorRecoveryManager = new ErrorRecoveryManager();