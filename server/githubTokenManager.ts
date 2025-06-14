
import { DataEncryption } from './security';

export class GitHubTokenManager {
  private static instance: GitHubTokenManager;
  private tokenCache = new Map<string, { token: string; expires: number }>();
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || DataEncryption.generateKey();
  }

  static getInstance(): GitHubTokenManager {
    if (!GitHubTokenManager.instance) {
      GitHubTokenManager.instance = new GitHubTokenManager();
    }
    return GitHubTokenManager.instance;
  }

  // Securely store GitHub token
  storeToken(userId: string, token: string, expiresIn: number = 3600000): void {
    try {
      const encrypted = DataEncryption.encrypt(token, this.encryptionKey);
      this.tokenCache.set(userId, {
        token: JSON.stringify(encrypted),
        expires: Date.now() + expiresIn
      });
      console.log(`[GITHUB TOKEN] Token stored for user ${userId}`);
    } catch (error) {
      console.error('[GITHUB TOKEN] Failed to store token:', error);
      throw new Error('Failed to store GitHub token securely');
    }
  }

  // Retrieve and decrypt GitHub token
  getToken(userId: string): string | null {
    try {
      const cached = this.tokenCache.get(userId);
      if (!cached) {
        console.warn(`[GITHUB TOKEN] No token found for user ${userId}`);
        return null;
      }

      if (Date.now() > cached.expires) {
        console.warn(`[GITHUB TOKEN] Token expired for user ${userId}`);
        this.tokenCache.delete(userId);
        return null;
      }

      const encryptedData = JSON.parse(cached.token);
      const decrypted = DataEncryption.decrypt(encryptedData, this.encryptionKey);
      return decrypted;
    } catch (error) {
      console.error('[GITHUB TOKEN] Failed to retrieve token:', error);
      this.tokenCache.delete(userId);
      return null;
    }
  }

  // Validate GitHub token
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'DependencyWarden/1.0',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      });

      if (response.ok) {
        console.log('[GITHUB TOKEN] Token validation successful');
        return true;
      } else {
        console.warn(`[GITHUB TOKEN] Token validation failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('[GITHUB TOKEN] Token validation error:', error);
      return false;
    }
  }

  // Get fallback public access token
  getFallbackToken(): string | null {
    const fallback = process.env.GITHUB_TOKEN;
    if (!fallback) {
      console.warn('[GITHUB TOKEN] No fallback token configured');
      return null;
    }
    return fallback;
  }

  // Remove token
  removeToken(userId: string): void {
    this.tokenCache.delete(userId);
    console.log(`[GITHUB TOKEN] Token removed for user ${userId}`);
  }

  // Clean expired tokens
  cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, cached] of this.tokenCache.entries()) {
      if (now > cached.expires) {
        this.tokenCache.delete(userId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[GITHUB TOKEN] Cleaned up ${cleaned} expired tokens`);
    }
  }

  // Get token statistics
  getTokenStats() {
    const total = this.tokenCache.size;
    const now = Date.now();
    const expired = Array.from(this.tokenCache.values())
      .filter(cached => now > cached.expires).length;
    
    return {
      total,
      active: total - expired,
      expired
    };
  }
}

export const githubTokenManager = GitHubTokenManager.getInstance();

// Cleanup expired tokens every hour
setInterval(() => {
  githubTokenManager.cleanupExpiredTokens();
}, 3600000);
