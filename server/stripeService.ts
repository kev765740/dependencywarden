import Stripe from 'stripe';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe with proper error handling
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
} else {
  console.warn('STRIPE_SECRET_KEY not configured - payment features will be unavailable');
}

export class StripeService {
  private ensureStripeConfigured(): void {
    if (!stripe) {
      throw new Error('Stripe not configured - please provide STRIPE_SECRET_KEY environment variable');
    }
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    this.ensureStripeConfigured();
    return await stripe!.customers.create({
      email,
      name,
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    this.ensureStripeConfigured();
    return await stripe!.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    this.ensureStripeConfigured();
    
    // Create price dynamically for the Pro plan
    let actualPriceId = priceId;
    if (priceId === 'price_pro_monthly') {
      try {
        // First check if we have an existing product
        const products = await stripe!.products.list({
          limit: 100,
        });
        
        let product = products.data.find(p => p.name === 'DependencyWarden Pro');
        
        if (!product) {
          // Create the product first
          product = await stripe!.products.create({
            name: 'DependencyWarden Pro',
            description: 'Advanced dependency monitoring, security scanning, and compliance management',
            type: 'service',
            metadata: {
              plan: 'pro',
              features: 'unlimited_repos,advanced_security,team_management,priority_support'
            }
          });
          console.log('Created Stripe product:', product.id);
        }
        
        // Now check for existing price for this product
        const prices = await stripe!.prices.list({
          product: product.id,
          limit: 10
        });
        
        let price = prices.data.find(p => 
          p.unit_amount === 2900 && 
          p.currency === 'usd' && 
          p.recurring?.interval === 'month'
        );
        
        if (!price) {
          // Create the price
          price = await stripe!.prices.create({
            product: product.id,
            unit_amount: 2900, // $29.00
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: {
              plan: 'pro_monthly'
            }
          });
          console.log('Created Stripe price:', price.id);
        }
        
        actualPriceId = price.id;
        console.log('Using Stripe price ID:', actualPriceId);
        
      } catch (error) {
        console.error('Error creating/finding Stripe product/price:', error);
        throw new Error('Unable to create subscription. Please contact support.');
      }
    }

    return await stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
      allow_promotion_codes: true,
    });
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.ensureStripeConfigured();
    return await stripe!.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.ensureStripeConfigured();
    return await stripe!.subscriptions.cancel(subscriptionId);
  }

  async updateUserSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    subscriptionStatus: string,
    currentPeriodEnd: Date
  ): Promise<void> {
    await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async handleWebhook(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!stripe) {
      console.error('Stripe not configured');
      return;
    }

    try {
      // Get the customer from the session
      const customer = await stripe.customers.retrieve(session.customer as string);
      
      if (customer.deleted || !customer.email) {
        console.error('Customer not found or has no email');
        return;
      }

      // Find the user by email
      const [user] = await db.select().from(users).where(eq(users.email, customer.email));
      
      if (!user) {
        console.error('User not found for email:', customer.email);
        return;
      }

      // If there's a subscription, retrieve it and update the user
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        await this.updateUserSubscription(
          user.id.toString(),
          subscription.customer as string,
          subscription.id,
          subscription.status,
          new Date(subscription.current_period_end * 1000)
        );

        console.log(`Checkout completed for user ${user.email}: subscription ${subscription.id}`);
      } else {
        // For one-time payments, just update the customer ID
        await db
          .update(users)
          .set({
            stripeCustomerId: session.customer as string,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log(`Checkout completed for user ${user.email}: one-time payment`);
      }
    } catch (error) {
      console.error('Error handling checkout completion:', error);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer.deleted || !customer.email) {
      console.error('Customer not found or has no email');
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, customer.email));
    
    if (!user) {
      console.error('User not found for email:', customer.email);
      return;
    }

    await this.updateUserSubscription(
      user.id,
      subscription.customer as string,
      subscription.id,
      subscription.status,
      new Date(subscription.current_period_end * 1000)
    );
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeSubscriptionId, subscription.id));

    if (user) {
      await db
        .update(users)
        .set({
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await this.handleSubscriptionUpdate(subscription);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeSubscriptionId, invoice.subscription as string));

      if (user) {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'past_due',
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    }
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }
}

export const stripeService = new StripeService();