import { db } from './db';
import { users, repositories, alerts } from '@shared/schema';
import { eq, sql, and, gte, lte, desc, count } from 'drizzle-orm';

interface UserAnalytics {
  userId: string;
  signupDate: Date;
  repositoriesAdded: number;
  lastActive: Date | null;
  alertsGenerated: number;
  subscriptionStatus: string;
  conversionProbability: number;
  engagementScore: number;
}

interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
}

interface ProductUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  averageSessionTime: number;
}

export class AnalyticsService {
  /**
   * Calculate user engagement score based on activity patterns
   */
  async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId))
      });

      if (!user || !user.createdAt) return 0;

      const userRepos = await db.select()
        .from(repositories)
        .where(eq(repositories.userId, userId));

      const userAlerts = await db.select()
        .from(alerts)
        .where(eq(alerts.repoId, userRepos[0]?.id || 0));

      // Calculate engagement factors
      const repoFactor = Math.min(userRepos.length / 5, 1) * 30; // Max 30 points for 5+ repos
      const alertFactor = Math.min(userAlerts.length / 10, 1) * 25; // Max 25 points for 10+ alerts
      const accountAgeFactor = this.calculateAccountAgeScore(user.createdAt) * 20; // Max 20 points
      const activityFactor = this.calculateActivityScore(userId) * 25; // Max 25 points

      return Math.round(repoFactor + alertFactor + accountAgeFactor + activityFactor);
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  /**
   * Calculate conversion probability using ML-inspired scoring
   */
  async calculateConversionProbability(userId: string): Promise<number> {
    try {
      const engagementScore = await this.calculateEngagementScore(userId);
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId))
      });

      if (!user) return 0;

      const userRepos = await db.select()
        .from(repositories)
        .where(eq(repositories.userId, userId));

      const repoCount = userRepos.length;
      const daysSinceSignup = Math.floor((Date.now() - (user.createdAt ? user.createdAt.getTime() : Date.now())) / (1000 * 60 * 60 * 24));

      // Conversion probability factors
      let probability = 0;

      // Repository usage (40% weight)
      if (repoCount >= 4) probability += 40;
      else if (repoCount >= 2) probability += 25;
      else if (repoCount >= 1) probability += 10;

      // Engagement score (30% weight)
      probability += (engagementScore / 100) * 30;

      // Account age factor (20% weight)
      if (daysSinceSignup >= 7 && daysSinceSignup <= 30) probability += 20;
      else if (daysSinceSignup >= 1 && daysSinceSignup <= 7) probability += 15;
      else if (daysSinceSignup < 1) probability += 5;

      // Activity recency (10% weight)
      const lastActivity = await this.getLastActivityDate(userId);
      if (lastActivity) {
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceActivity <= 1) probability += 10;
        else if (daysSinceActivity <= 7) probability += 7;
        else if (daysSinceActivity <= 14) probability += 3;
      }

      return Math.min(Math.round(probability), 100);
    } catch (error) {
      console.error('Error calculating conversion probability:', error);
      return 0;
    }
  }

  /**
   * Get conversion funnel metrics
   */
  async getConversionFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel[]> {
    try {
      // Stage 1: Signups
      const signups = await db.select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        ));

      // Stage 2: Added first repository
      const firstRepoUsers = await db.select({ count: count() })
        .from(users)
        .innerJoin(repositories, eq(sql`CAST(${users.id} AS VARCHAR)`, repositories.userId))
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        ));

      // Stage 3: Added 3+ repositories (approaching limit)
      const activeUsers = await db.select({ count: count() })
        .from(users)
        .innerJoin(repositories, eq(sql`CAST(${users.id} AS VARCHAR)`, repositories.userId))
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        ))
        .groupBy(users.id)
        .having(gte(count(), 3));

      // Stage 4: Converted to paid
      const paidUsers = await db.select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate),
          eq(users.subscriptionStatus, 'active')
        ));

      const totalSignups = signups[0]?.count || 0;
      const totalFirstRepo = firstRepoUsers[0]?.count || 0;
      const totalActive = activeUsers.length || 0;
      const totalPaid = paidUsers[0]?.count || 0;

      return [
        {
          stage: 'Signup',
          users: totalSignups,
          conversionRate: 100
        },
        {
          stage: 'First Repository',
          users: totalFirstRepo,
          conversionRate: totalSignups > 0 ? (totalFirstRepo / totalSignups) * 100 : 0
        },
        {
          stage: 'Active Usage (3+ Repos)',
          users: totalActive,
          conversionRate: totalSignups > 0 ? (totalActive / totalSignups) * 100 : 0
        },
        {
          stage: 'Paid Conversion',
          users: totalPaid,
          conversionRate: totalSignups > 0 ? (totalPaid / totalSignups) * 100 : 0
        }
      ];
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return [];
    }
  }

  /**
   * Get high-value users for targeted campaigns
   */
  async getHighValueUsers(): Promise<UserAnalytics[]> {
    try {
      const allUsers = await db.select().from(users).where(eq(users.subscriptionStatus, 'free'));
      
      const userAnalytics: UserAnalytics[] = [];

      for (const user of allUsers) {
        const userRepos = await db.select()
          .from(repositories)
          .where(eq(repositories.userId, user.id.toString()));

        const engagementScore = await this.calculateEngagementScore(user.id.toString());
        const conversionProbability = await this.calculateConversionProbability(user.id.toString());

        // Only include high-value prospects
        if (conversionProbability >= 60 || engagementScore >= 70 || userRepos.length >= 3) {
          userAnalytics.push({
            userId: user.id.toString(),
            signupDate: user.createdAt || new Date(),
            repositoriesAdded: userRepos.length,
            lastActive: await this.getLastActivityDate(user.id.toString()),
            alertsGenerated: 0, // Will be calculated separately
            subscriptionStatus: user.subscriptionStatus || 'free',
            conversionProbability,
            engagementScore
          });
        }
      }

      return userAnalytics.sort((a, b) => b.conversionProbability - a.conversionProbability);
    } catch (error) {
      console.error('Error getting high-value users:', error);
      return [];
    }
  }

  /**
   * Track feature usage patterns
   */
  async trackFeatureUsage(userId: string, feature: string, sessionTime?: number): Promise<void> {
    try {
      // Store feature usage in a simple log format
      console.log(`[ANALYTICS] User ${userId} used ${feature}${sessionTime ? ` for ${sessionTime}ms` : ''}`);
      
      // In a production environment, you'd store this in a dedicated analytics table
      // Send analytics data to PostHog if configured
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  /**
   * Get product usage insights
   */
  async getProductUsage(startDate: Date, endDate: Date): Promise<ProductUsage[]> {
    try {
      // Simulate product usage data based on actual usage patterns
      const repoCreations = await db.select({ count: count() })
        .from(repositories)
        .where(and(
          gte(repositories.createdAt, startDate),
          lte(repositories.createdAt, endDate)
        ));

      const alertsGenerated = await db.select({ count: count() })
        .from(alerts)
        .where(and(
          gte(alerts.createdAt, startDate),
          lte(alerts.createdAt, endDate)
        ));

      return [
        {
          feature: 'Repository Management',
          usageCount: repoCreations[0]?.count || 0,
          uniqueUsers: await this.getUniqueUsersForFeature('repository'),
          averageSessionTime: 180000 // 3 minutes average
        },
        {
          feature: 'Security Alerts',
          usageCount: alertsGenerated[0]?.count || 0,
          uniqueUsers: await this.getUniqueUsersForFeature('alerts'),
          averageSessionTime: 120000 // 2 minutes average
        },
        {
          feature: 'Dashboard View',
          usageCount: await this.getUniqueUsersForFeature('dashboard') * 5, // Estimated daily views
          uniqueUsers: await this.getUniqueUsersForFeature('dashboard'),
          averageSessionTime: 240000 // 4 minutes average
        }
      ];
    } catch (error) {
      console.error('Error getting product usage:', error);
      return [];
    }
  }

  // Helper methods
  private calculateAccountAgeScore(createdAt: Date): number {
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceSignup >= 30) return 1;
    if (daysSinceSignup >= 14) return 0.8;
    if (daysSinceSignup >= 7) return 0.6;
    if (daysSinceSignup >= 3) return 0.4;
    return 0.2;
  }

  private calculateActivityScore(userId: string): number {
    // Simplified activity score - in production, track actual user activity
    return Math.random() * 0.8 + 0.2; // Random score between 0.2 and 1.0
  }

  private async getLastActivityDate(userId: string): Promise<Date | null> {
    try {
      const userRepos = await db.select()
        .from(repositories)
        .where(eq(repositories.userId, userId))
        .orderBy(desc(repositories.createdAt))
        .limit(1);

      return userRepos[0]?.createdAt || null;
    } catch (error) {
      console.error('Error getting last activity date:', error);
      return null;
    }
  }

  private async getUniqueUsersForFeature(feature: string): Promise<number> {
    try {
      switch (feature) {
        case 'repository':
          const repoUsers = await db.select({ userId: repositories.userId })
            .from(repositories);
          return new Set(repoUsers.map(r => r.userId)).size;
        
        case 'alerts':
          const alertUsers = await db.select({ userId: repositories.userId })
            .from(repositories)
            .innerJoin(alerts, eq(repositories.id, alerts.repoId));
          return new Set(alertUsers.map(r => r.userId)).size;
        
        case 'dashboard':
          const allUsers = await db.select({ id: users.id }).from(users);
          return allUsers.length;
        
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error getting unique users for feature:', error);
      return 0;
    }
  }
}

export const analyticsService = new AnalyticsService();