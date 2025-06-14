
/**
 * Auto-Fix Rate Limiter
 * Manages GitHub API rate limiting for auto-fix operations
 */

export class AutoFixRateLimiter {
  private static instance: AutoFixRateLimiter;
  private rateLimits = new Map<string, {
    count: number;
    resetTime: number;
    limit: number;
  }>();

  private readonly GITHUB_RATE_LIMITS = {
    core: 5000, // requests per hour
    search: 30, // requests per minute
    graphql: 5000, // points per hour
    user: 1000, // requests per hour for user tokens
  };

  static getInstance(): AutoFixRateLimiter {
    if (!AutoFixRateLimiter.instance) {
      AutoFixRateLimiter.instance = new AutoFixRateLimiter();
    }
    return AutoFixRateLimiter.instance;
  }

  async checkRateLimit(
    userId: string, 
    repositoryId: number, 
    operation: 'create_pr' | 'update_file' | 'get_repo' | 'create_branch'
  ): Promise<{ allowed: boolean; waitTime?: number; remaining?: number }> {
    
    try {
      const { storage } = await import('./storage');
      const key = `${userId}-${repositoryId}-${operation}`;
      
      // Get current rate limit from database
      const rateLimit = await this.getRateLimit(userId, repositoryId);
      
      if (!rateLimit) {
        // Initialize rate limit
        await this.initializeRateLimit(userId, repositoryId);
        return { allowed: true, remaining: this.getOperationLimit(operation) - 1 };
      }

      const now = Date.now();
      const resetTime = new Date(rateLimit.resetTime).getTime();

      // Reset if time window has passed
      if (now >= resetTime) {
        await this.resetRateLimit(userId, repositoryId);
        return { allowed: true, remaining: this.getOperationLimit(operation) - 1 };
      }

      // Check if under limit
      const operationLimit = this.getOperationLimit(operation);
      if (rateLimit.requestCount < operationLimit) {
        await this.incrementRateLimit(userId, repositoryId);
        return { 
          allowed: true, 
          remaining: operationLimit - rateLimit.requestCount - 1 
        };
      }

      // Rate limited
      const waitTime = resetTime - now;
      return { 
        allowed: false, 
        waitTime: Math.ceil(waitTime / 1000), // seconds
        remaining: 0 
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow by default on error to avoid blocking operations
      return { allowed: true, remaining: 100 };
    }
  }

  private async getRateLimit(userId: string, repositoryId: number) {
    try {
      const { db } = await import('./db');
      const { autoFixRateLimit } = await import('../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const result = await db.query.autoFixRateLimit.findFirst({
        where: and(
          eq(autoFixRateLimit.userId, parseInt(userId)),
          eq(autoFixRateLimit.repositoryId, repositoryId)
        )
      });

      return result;
    } catch (error) {
      console.error('Error getting rate limit:', error);
      return null;
    }
  }

  private async initializeRateLimit(userId: string, repositoryId: number) {
    try {
      const { db } = await import('./db');
      const { autoFixRateLimit } = await import('../shared/schema');

      const resetTime = new Date();
      resetTime.setHours(resetTime.getHours() + 1); // Reset every hour

      await db.insert(autoFixRateLimit).values({
        userId: parseInt(userId),
        repositoryId,
        apiProvider: 'github',
        requestCount: 1,
        resetTime,
        dailyLimit: this.GITHUB_RATE_LIMITS.user
      });
    } catch (error) {
      console.error('Error initializing rate limit:', error);
    }
  }

  private async incrementRateLimit(userId: string, repositoryId: number) {
    try {
      const { db } = await import('./db');
      const { autoFixRateLimit } = await import('../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      await db.update(autoFixRateLimit)
        .set({ 
          requestCount: db.raw('request_count + 1'),
          updatedAt: new Date()
        })
        .where(and(
          eq(autoFixRateLimit.userId, parseInt(userId)),
          eq(autoFixRateLimit.repositoryId, repositoryId)
        ));
    } catch (error) {
      console.error('Error incrementing rate limit:', error);
    }
  }

  private async resetRateLimit(userId: string, repositoryId: number) {
    try {
      const { db } = await import('./db');
      const { autoFixRateLimit } = await import('../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const resetTime = new Date();
      resetTime.setHours(resetTime.getHours() + 1);

      await db.update(autoFixRateLimit)
        .set({ 
          requestCount: 1,
          resetTime,
          updatedAt: new Date()
        })
        .where(and(
          eq(autoFixRateLimit.userId, parseInt(userId)),
          eq(autoFixRateLimit.repositoryId, repositoryId)
        ));
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  private getOperationLimit(operation: string): number {
    switch (operation) {
      case 'create_pr': return 20; // Conservative limit for PR creation
      case 'update_file': return 50; // File updates
      case 'get_repo': return 100; // Repository info
      case 'create_branch': return 30; // Branch creation
      default: return 50;
    }
  }

  // GitHub API response headers integration
  updateFromGitHubHeaders(
    userId: string, 
    repositoryId: number, 
    headers: { [key: string]: string }
  ) {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const resetTime = parseInt(headers['x-ratelimit-reset'] || '0') * 1000;
    
    // Update internal rate limit tracking based on GitHub's response
    const key = `${userId}-${repositoryId}`;
    this.rateLimits.set(key, {
      count: 5000 - remaining,
      resetTime,
      limit: 5000
    });
  }

  // Get current rate limit status
  async getRateLimitStatus(userId: string, repositoryId: number) {
    const rateLimit = await this.getRateLimit(userId, repositoryId);
    
    if (!rateLimit) {
      return {
        requestCount: 0,
        limit: this.GITHUB_RATE_LIMITS.user,
        remaining: this.GITHUB_RATE_LIMITS.user,
        resetTime: null
      };
    }

    return {
      requestCount: rateLimit.requestCount,
      limit: rateLimit.dailyLimit,
      remaining: rateLimit.dailyLimit - rateLimit.requestCount,
      resetTime: rateLimit.resetTime
    };
  }

  // Exponential backoff for rate limited requests
  async waitForRateLimit(waitTime: number): Promise<void> {
    console.log(`[RATE LIMITER] Waiting ${waitTime} seconds for rate limit reset`);
    return new Promise(resolve => setTimeout(resolve, waitTime * 1000));
  }
}

export const autoFixRateLimiter = AutoFixRateLimiter.getInstance();
