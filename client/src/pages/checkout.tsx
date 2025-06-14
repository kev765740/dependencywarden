import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing?success=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Subscription</CardTitle>
        <CardDescription>
          Enter your payment details to upgrade to Pro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={!stripe || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Subscribe to Pro'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Check if Stripe is configured
    if (!stripePromise) {
      setError("Payment processing is not configured. Please contact support.");
      return;
    }

    // Create PaymentIntent when component loads
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-checkout-session", {
          priceId: "price_pro_monthly" // This should be configurable
        });
        
        // Handle response properly - apiRequest already returns JSON
        if (response.clientSecret) {
          setClientSecret(response.clientSecret);
        } else if (response.url) {
          // Redirect to Stripe Checkout
          window.location.href = response.url;
        } else {
          setError("Invalid response from payment service. Please try again.");
        }
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        
        // Check if it's a Stripe configuration error
        const errorMessage = error?.message || "";
        if (errorMessage.includes("Payment processing is currently unavailable") || 
            errorMessage.includes("Stripe not configured") ||
            errorMessage.includes("STRIPE_NOT_CONFIGURED")) {
          setError("Payment processing is not configured. Please contact support to upgrade your plan.");
        } else {
          setError("Failed to initialize payment. Please try again.");
        }
        
        toast({
          title: "Payment Setup Error", 
          description: errorMessage.includes("Payment processing is currently unavailable") ? 
            "Payment processing is currently unavailable. Please contact support." :
            "Unable to initialize payment. Please contact support if this continues.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.href = '/billing'}
              variant="outline"
              className="w-full"
            >
              Return to Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret && !error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner className="h-8 w-8" />
              <p className="text-slate-600">Setting up your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Service Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Payment processing is currently unavailable. Please contact support.
            </p>
            <Button 
              onClick={() => window.location.href = '/billing'}
              variant="outline"
              className="w-full"
            >
              Return to Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}