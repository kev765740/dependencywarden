export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: 'usd';
  interval: 'month' | 'year';
  features: string[];
  limits: {
    repositories: number;
    scansPerMonth: number;
    teamMembers: number;
    retentionDays: number;
  };
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageMetrics {
  userId: string;
  period: string;
  repositoriesScanned: number;
  totalScans: number;
  teamMembers: number;
  limits: {
    repositories: number;
    scansPerMonth: number;
    teamMembers: number;
  };
  percentageUsed: {
    repositories: number;
    scans: number;
    teamMembers: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'void' | 'draft';
  amount: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

class PaymentService {
  private readonly STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo';
  
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'plan_free',
      name: 'Free',
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: [
        '3 repositories',
        '10 scans per month',
        'Basic vulnerability detection',
        'Email notifications',
        'Community support'
      ],
      limits: {
        repositories: 3,
        scansPerMonth: 10,
        teamMembers: 1,
        retentionDays: 30
      }
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      price: 29,
      currency: 'usd',
      interval: 'month',
      features: [
        '25 repositories',
        'Unlimited scans',
        'Advanced vulnerability analysis',
        'Custom security policies',
        'Slack/Teams integration',
        'Priority support',
        'API access'
      ],
      limits: {
        repositories: 25,
        scansPerMonth: -1, // unlimited
        teamMembers: 5,
        retentionDays: 90
      },
      popular: true
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      price: 99,
      currency: 'usd',
      interval: 'month',
      features: [
        'Unlimited repositories',
        'Unlimited scans',
        'AI-powered security copilot',
        'Custom compliance frameworks',
        'SSO integration',
        'Dedicated support',
        'On-premise deployment',
        'Custom integrations'
      ],
      limits: {
        repositories: -1, // unlimited
        scansPerMonth: -1, // unlimited
        teamMembers: -1, // unlimited
        retentionDays: 365
      }
    }
  ];

  private mockSubscriptions: Map<string, Subscription> = new Map();
  private mockUsageMetrics: Map<string, UsageMetrics> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock subscription for demo user
    const mockSubscription: Subscription = {
      id: 'sub_demo123',
      userId: '1',
      planId: 'plan_pro',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockSubscriptions.set('1', mockSubscription);

    // Mock usage metrics
    const mockUsage: UsageMetrics = {
      userId: '1',
      period: new Date().toISOString().substring(0, 7), // YYYY-MM
      repositoriesScanned: 8,
      totalScans: 47,
      teamMembers: 3,
      limits: {
        repositories: 25,
        scansPerMonth: -1,
        teamMembers: 5
      },
      percentageUsed: {
        repositories: 32, // 8/25
        scans: 0, // unlimited
        teamMembers: 60 // 3/5
      }
    };

    this.mockUsageMetrics.set('1', mockUsage);
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlans;
  }

  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    return this.subscriptionPlans.find(plan => plan.id === planId) || null;
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.mockSubscriptions.get(userId) || null;
  }

  async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<Subscription> {
    try {
      // In production, this would create a Stripe subscription
      const plan = await this.getPlan(planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      const subscription: Subscription = {
        id: 'sub_' + Date.now(),
        userId,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.mockSubscriptions.set(userId, subscription);
      
      // Initialize usage metrics
      await this.initializeUsageMetrics(userId, planId);

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(userId: string, planId: string): Promise<Subscription> {
    try {
      const currentSub = this.mockSubscriptions.get(userId);
      if (!currentSub) {
        throw new Error('No active subscription found');
      }

      const updatedSub: Subscription = {
        ...currentSub,
        planId,
        updatedAt: new Date().toISOString()
      };

      this.mockSubscriptions.set(userId, updatedSub);
      await this.updateUsageMetrics(userId, planId);

      return updatedSub;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async cancelSubscription(userId: string, immediate: boolean = false): Promise<Subscription> {
    try {
      const subscription = this.mockSubscriptions.get(userId);
      if (!subscription) {
        throw new Error('No subscription found');
      }

      const updatedSub: Subscription = {
        ...subscription,
        status: immediate ? 'canceled' : subscription.status,
        cancelAtPeriodEnd: !immediate,
        updatedAt: new Date().toISOString()
      };

      this.mockSubscriptions.set(userId, updatedSub);
      return updatedSub;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async getUsageMetrics(userId: string): Promise<UsageMetrics | null> {
    return this.mockUsageMetrics.get(userId) || null;
  }

  async trackUsage(userId: string, type: 'scan' | 'repository' | 'team_member', count: number = 1): Promise<void> {
    try {
      const currentUsage = this.mockUsageMetrics.get(userId);
      if (!currentUsage) {
        console.warn(`No usage metrics found for user ${userId}`);
        return;
      }

      const subscription = await this.getUserSubscription(userId);
      const plan = subscription ? await this.getPlan(subscription.planId) : null;

      if (!plan) {
        console.warn(`No plan found for user ${userId}`);
        return;
      }

      let updatedUsage = { ...currentUsage };

      switch (type) {
        case 'scan':
          updatedUsage.totalScans += count;
          break;
        case 'repository':
          updatedUsage.repositoriesScanned = Math.max(updatedUsage.repositoriesScanned, count);
          break;
        case 'team_member':
          updatedUsage.teamMembers = count;
          break;
      }

      // Recalculate percentages
      updatedUsage.percentageUsed = {
        repositories: plan.limits.repositories === -1 ? 0 : Math.round((updatedUsage.repositoriesScanned / plan.limits.repositories) * 100),
        scans: plan.limits.scansPerMonth === -1 ? 0 : Math.round((updatedUsage.totalScans / plan.limits.scansPerMonth) * 100),
        teamMembers: plan.limits.teamMembers === -1 ? 0 : Math.round((updatedUsage.teamMembers / plan.limits.teamMembers) * 100)
      };

      this.mockUsageMetrics.set(userId, updatedUsage);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  async checkUsageLimits(userId: string, type: 'scan' | 'repository' | 'team_member'): Promise<{ allowed: boolean; limit: number; current: number }> {
    try {
      const usage = await this.getUsageMetrics(userId);
      const subscription = await this.getUserSubscription(userId);
      const plan = subscription ? await this.getPlan(subscription.planId) : null;

      if (!usage || !plan) {
        return { allowed: false, limit: 0, current: 0 };
      }

      switch (type) {
        case 'scan':
          return {
            allowed: plan.limits.scansPerMonth === -1 || usage.totalScans < plan.limits.scansPerMonth,
            limit: plan.limits.scansPerMonth,
            current: usage.totalScans
          };
        case 'repository':
          return {
            allowed: plan.limits.repositories === -1 || usage.repositoriesScanned < plan.limits.repositories,
            limit: plan.limits.repositories,
            current: usage.repositoriesScanned
          };
        case 'team_member':
          return {
            allowed: plan.limits.teamMembers === -1 || usage.teamMembers < plan.limits.teamMembers,
            limit: plan.limits.teamMembers,
            current: usage.teamMembers
          };
        default:
          return { allowed: false, limit: 0, current: 0 };
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { allowed: false, limit: 0, current: 0 };
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<{ clientSecret: string }> {
    try {
      // In production, this would call Stripe's payment intent API
      await this.delay(1000);
      
      return {
        clientSecret: 'pi_demo_' + Date.now() + '_secret_demo'
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    // Mock invoices for demo
    return [
      {
        id: 'in_demo123',
        number: 'DW-2024-001',
        status: 'paid',
        amount: 29,
        currency: 'usd',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/demo',
        invoicePdf: 'https://invoice.stripe.com/demo.pdf'
      },
      {
        id: 'in_demo122',
        number: 'DW-2023-012',
        status: 'paid',
        amount: 29,
        currency: 'usd',
        dueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/demo2',
        invoicePdf: 'https://invoice.stripe.com/demo2.pdf'
      }
    ];
  }

  private async initializeUsageMetrics(userId: string, planId: string): Promise<void> {
    const plan = await this.getPlan(planId);
    if (!plan) return;

    const usage: UsageMetrics = {
      userId,
      period: new Date().toISOString().substring(0, 7),
      repositoriesScanned: 0,
      totalScans: 0,
      teamMembers: 1,
      limits: plan.limits,
      percentageUsed: {
        repositories: 0,
        scans: 0,
        teamMembers: plan.limits.teamMembers === -1 ? 0 : Math.round(1 / plan.limits.teamMembers * 100)
      }
    };

    this.mockUsageMetrics.set(userId, usage);
  }

  private async updateUsageMetrics(userId: string, planId: string): Promise<void> {
    const currentUsage = this.mockUsageMetrics.get(userId);
    const plan = await this.getPlan(planId);
    
    if (!currentUsage || !plan) return;

    const updatedUsage: UsageMetrics = {
      ...currentUsage,
      limits: plan.limits,
      percentageUsed: {
        repositories: plan.limits.repositories === -1 ? 0 : Math.round((currentUsage.repositoriesScanned / plan.limits.repositories) * 100),
        scans: plan.limits.scansPerMonth === -1 ? 0 : Math.round((currentUsage.totalScans / plan.limits.scansPerMonth) * 100),
        teamMembers: plan.limits.teamMembers === -1 ? 0 : Math.round((currentUsage.teamMembers / plan.limits.teamMembers) * 100)
      }
    };

    this.mockUsageMetrics.set(userId, updatedUsage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const paymentService = new PaymentService(); 