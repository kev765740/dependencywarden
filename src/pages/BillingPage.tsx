import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { paymentService, SubscriptionPlan, Subscription, UsageMetrics, Invoice } from '@/lib/paymentService';
import { useAuth } from '@/hooks/use-auth';
import { 
  CreditCard, 
  Download, 
  CheckCircle, 
  Clock, 
  Users, 
  Database, 
  Scan,
  TrendingUp,
  AlertTriangle,
  Star
} from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, [user?.id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, usageData, invoicesData] = await Promise.all([
        paymentService.getPlans(),
        user?.id ? paymentService.getUserSubscription(user.id) : null,
        user?.id ? paymentService.getUsageMetrics(user.id) : null,
        user?.id ? paymentService.getInvoices(user.id) : []
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setUsage(usageData);
      setInvoices(invoicesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId: string) => {
    if (!user?.id) return;

    try {
      if (currentSubscription) {
        await paymentService.updateSubscription(user.id, planId);
        toast({
          title: 'Success',
          description: 'Your subscription has been updated successfully'
        });
      } else {
        await paymentService.createSubscription(user.id, planId, 'pm_demo_card');
        toast({
          title: 'Success',
          description: 'Your subscription has been created successfully'
        });
      }
      
      await loadBillingData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id || !currentSubscription) return;

    try {
      await paymentService.cancelSubscription(user.id, false);
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the current billing period'
      });
      await loadBillingData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === currentSubscription?.planId) || plans[0];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription, usage, and billing information</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {currentSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {currentPlan.name}
                        {currentPlan.popular && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </h3>
                      <p className="text-gray-600">
                        ${currentPlan.price}/{currentPlan.interval}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                        {currentSubscription.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Current Period</p>
                      <p className="font-medium">
                        {new Date(currentSubscription.currentPeriodStart).toLocaleDateString()} - {' '}
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Billing Date</p>
                      <p className="font-medium">
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleCancelSubscription()}
                      disabled={currentSubscription.cancelAtPeriodEnd}
                    >
                      {currentSubscription.cancelAtPeriodEnd ? 'Already Cancelled' : 'Cancel Subscription'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You don't have an active subscription</p>
                  <Button onClick={() => handlePlanChange('plan_pro')}>
                    Subscribe to Pro Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {usage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Overview
                </CardTitle>
                <CardDescription>Your current usage for {usage.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        Repositories
                      </span>
                      <span className="text-sm font-medium">
                        {usage.repositoriesScanned} / {usage.limits.repositories === -1 ? '∞' : usage.limits.repositories}
                      </span>
                    </div>
                    <Progress value={usage.percentageUsed.repositories} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Scan className="h-4 w-4" />
                        Scans
                      </span>
                      <span className="text-sm font-medium">
                        {usage.totalScans} / {usage.limits.scansPerMonth === -1 ? '∞' : usage.limits.scansPerMonth}
                      </span>
                    </div>
                    <Progress value={usage.percentageUsed.scans} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Team Members
                      </span>
                      <span className="text-sm font-medium">
                        {usage.teamMembers} / {usage.limits.teamMembers === -1 ? '∞' : usage.limits.teamMembers}
                      </span>
                    </div>
                    <Progress value={usage.percentageUsed.teamMembers} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-600' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-600">/{plan.interval}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    {currentSubscription?.planId === plan.id ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handlePlanChange(plan.id)}
                      >
                        {currentSubscription ? 'Switch Plan' : 'Subscribe'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {usage ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Usage Details</CardTitle>
                  <CardDescription>Period: {usage.period}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Repositories Scanned</span>
                      <span className="font-medium">{usage.repositoriesScanned}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Scans</span>
                      <span className="font-medium">{usage.totalScans}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Team Members</span>
                      <span className="font-medium">{usage.teamMembers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Limits</CardTitle>
                  <CardDescription>Your current plan allowances</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Repository Limit</span>
                      <span className="font-medium">
                        {usage.limits.repositories === -1 ? 'Unlimited' : usage.limits.repositories}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Scan Limit</span>
                      <span className="font-medium">
                        {usage.limits.scansPerMonth === -1 ? 'Unlimited' : usage.limits.scansPerMonth}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Team Member Limit</span>
                      <span className="font-medium">
                        {usage.limits.teamMembers === -1 ? 'Unlimited' : usage.limits.teamMembers}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">No usage data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>Your billing history and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status === 'paid' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${invoice.amount} {invoice.currency.toUpperCase()}</p>
                          {invoice.paidAt && (
                            <p className="text-sm text-gray-600">
                              Paid: {new Date(invoice.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No invoices available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 