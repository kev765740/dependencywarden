import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Check, CreditCard, Star, Calendar, AlertTriangle, ExternalLink, Crown } from "lucide-react";

interface SubscriptionDetails {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionStatus {
  subscriptionStatus: string;
  subscriptionDetails: SubscriptionDetails | null;
  hasStripeCustomer: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [urlParams] = useState(new URLSearchParams(window.location.search));

  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription-status"],
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/subscribe");
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('Billing subscribe response:', data);
      if (data.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else if (data.success && !data.checkoutUrl) {
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
    onError: (error: any) => {
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
      
      // Check if it's a Stripe configuration error
      const errorMessage = error?.message || "";
      if (errorMessage.includes("Stripe not configured") || errorMessage.includes("STRIPE_SECRET_KEY")) {
        toast({
          title: "Payment Unavailable",
          description: "Payment processing is currently unavailable. Please contact support to upgrade your plan.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "Unable to process subscription. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/billing/portal");
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/billing/cancel");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-status"] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of the current period.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment Successful",
        description: "Welcome to the Pro plan! Your subscription is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-status"] });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your subscription upgrade was canceled.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient, toast, urlParams]);

  const handleUpgrade = () => {
    // Redirect to checkout page for Stripe payment flow
    console.log('Redirecting to checkout page...');
    window.location.href = '/checkout';
  };

  const handleManageSubscription = () => {
    createPortalMutation.mutate();
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      cancelSubscriptionMutation.mutate();
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access billing information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const isProUser = subscriptionStatus?.subscriptionStatus === 'active' || 
                   subscriptionStatus?.subscriptionStatus === 'trialing';
  const isPastDue = subscriptionStatus?.subscriptionStatus === 'past_due';
  const isCanceled = subscriptionStatus?.subscriptionStatus === 'canceled';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      </div>

      {/* Status Alerts */}
      {isPastDue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your payment failed. Please update your payment method to continue using Pro features.
          </AlertDescription>
        </Alert>
      )}

      {isCanceled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your subscription has been canceled and will end on{" "}
            {subscriptionStatus?.subscriptionDetails?.currentPeriodEnd ? 
              new Date(subscriptionStatus.subscriptionDetails.currentPeriodEnd).toLocaleDateString() : 
              "the current period end"}.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isProUser ? <Crown className="w-5 h-5 text-yellow-500" /> : <Star className="w-5 h-5" />}
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription status and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {isProUser ? "Pro Plan" : "Free Plan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isProUser ? "Unlimited repositories and advanced features" : "Up to 3 repositories"}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={isProUser ? "default" : "secondary"}>
                {isProUser ? "Active" : "Free"}
              </Badge>
              {subscriptionStatus?.subscriptionDetails?.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {new Date(subscriptionStatus.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {isProUser ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={createPortalMutation.isPending}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
              {!subscriptionStatus?.subscriptionDetails?.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          ) : (
            <Button 
              onClick={handleUpgrade}
              disabled={createCheckoutMutation.isPending}
              className="w-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              {createCheckoutMutation.isPending ? "Processing..." : "Upgrade to Pro"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Free Plan
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Up to 3 repositories</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Daily vulnerability scans</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Email notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Basic license monitoring</span>
              </li>
            </ul>
            {isProUser ? (
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                Current Plan
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => toast({
                  title: "Already on Free Plan",
                  description: "You're currently using the Free plan. Upgrade to Pro for more features!",
                })}
              >
                <Star className="w-4 h-4 mr-2" />
                Start Free
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="relative border-primary">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Pro Plan
            </CardTitle>
            <CardDescription>Advanced monitoring for teams</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              $29<span className="text-sm font-normal">/month</span>
              <div className="text-sm text-green-600">7-day free trial</div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Unlimited repositories</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Hourly vulnerability scans</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Email & Slack notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Advanced license monitoring</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">File-level dependency tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </li>
            </ul>
            {!isProUser && (
              <Button 
                onClick={handleUpgrade}
                disabled={createCheckoutMutation.isPending}
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                {createCheckoutMutation.isPending ? "Processing..." : "Start Free Trial"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
            <div>
              <h4 className="font-medium">Secure Payments</h4>
              <p className="text-sm text-muted-foreground">
                All payments are securely processed by Stripe. We never store your payment information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}