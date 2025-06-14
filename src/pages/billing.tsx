import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Crown, 
  Shield,
  Zap,
  Clock,
  Users,
  GitBranch,
  Bell,
  Smartphone,
  Star,
  CheckCircle
} from "lucide-react";

interface SubscriptionStatus {
  subscriptionStatus: string;
  subscriptionDetails: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  hasStripeCustomer: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');

  // No automatic redirect - allow viewing pricing for non-authenticated users

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/billing/status'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Please log in to subscribe");
      }
      const response = await apiRequest("POST", "/api/billing/subscribe");
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        toast({
          title: "Success",
          description: "Subscription activated successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/billing/status'] });
      } else {
        toast({
          title: "Error",
          description: "Unexpected response format",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      if (error.message === "Please log in to subscribe" || isUnauthorizedError(error)) {
        toast({
          title: "Please Log In",
          description: "You need to log in to subscribe to Pro features.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Payment Failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/billing/cancel");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/status'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Customer portal mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/portal");
      return response;
    },
    onSuccess: (data: any) => {
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Unable to access billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isActive = subscriptionStatus?.subscriptionStatus === 'active';
  const isPro = isActive && subscriptionStatus?.subscriptionDetails?.status === 'active';
  const isCancelled = subscriptionStatus?.subscriptionDetails?.cancelAtPeriodEnd;

  if (isLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Secure your repositories with comprehensive dependency monitoring. 
            Start with our free tier or upgrade to Pro for advanced features.
          </p>
        </div>

        {/* Current Status Alert */}
        {isPro && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Pro Plan Active</strong> - You have access to all premium features.
              {subscriptionStatus?.subscriptionDetails?.currentPeriodEnd && (
                <span className="block mt-1">
                  Next billing date: {formatDate(subscriptionStatus.subscriptionDetails.currentPeriodEnd)}
                </span>
              )}
              {isCancelled && (
                <span className="block mt-1 text-orange-600">
                  ⚠️ Subscription will end on {formatDate(subscriptionStatus.subscriptionDetails.currentPeriodEnd)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Tier */}
          <Card className={`relative ${selectedPlan === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Free Tier</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Up to 3 repositories</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Weekly vulnerability scans</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Basic license change detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Email notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400">Real-time scanning</span>
                </div>
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400">Slack integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400">Priority support</span>
                </div>
              </div>
              <Button 
                variant={!isPro ? "default" : "outline"} 
                className="w-full"
                disabled={!isPro}
                onClick={() => setSelectedPlan('free')}
              >
                {!isPro ? "Current Plan" : "Downgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative ${selectedPlan === 'pro' ? 'ring-2 ring-blue-500' : ''} border-blue-200`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <CardDescription>For teams and serious developers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  7-day free trial
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span><strong>Unlimited repositories</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span><strong>Real-time scanning</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Advanced vulnerability detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Slack & webhook notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Advanced analytics & reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Custom scan scheduling</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Team collaboration features</span>
                </div>
              </div>
              {!isPro ? (
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = "/api/login";
                    } else {
                      subscribeMutation.mutate();
                    }
                  }}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {!isAuthenticated ? "Log In to Subscribe" : "Start 7-Day Free Trial"}
                    </div>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button variant="outline" className="w-full" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  {!isCancelled && (
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>
              See what's included in each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-2">Feature</th>
                    <th className="text-center py-4 px-2">Free</th>
                    <th className="text-center py-4 px-2">Pro</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-2 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-slate-500" />
                      Repositories
                    </td>
                    <td className="text-center py-4 px-2">Up to 3</td>
                    <td className="text-center py-4 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      Scan Frequency
                    </td>
                    <td className="text-center py-4 px-2">Weekly</td>
                    <td className="text-center py-4 px-2">Real-time</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-2 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-500" />
                      Notifications
                    </td>
                    <td className="text-center py-4 px-2">Email only</td>
                    <td className="text-center py-4 px-2">Email + Slack + Webhooks</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      Team Features
                    </td>
                    <td className="text-center py-4 px-2">
                      <X className="w-4 h-4 text-slate-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-2">
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      Mobile App
                    </td>
                    <td className="text-center py-4 px-2">Coming Soon</td>
                    <td className="text-center py-4 px-2">Priority Access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">What happens during the free trial?</h4>
              <p className="text-slate-600">
                You get full access to all Pro features for 7 days. No credit card required to start. 
                You can cancel anytime during the trial period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-slate-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated 
                and reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-slate-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and ACH payments 
                through our secure Stripe integration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is my data secure?</h4>
              <p className="text-slate-600">
                Absolutely. We use enterprise-grade security, end-to-end encryption, and never store 
                your repository code. We only analyze your dependency files.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}