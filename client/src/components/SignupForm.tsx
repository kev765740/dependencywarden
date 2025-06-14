import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Github, ArrowRight, CheckCircle } from "lucide-react";

interface SignupFormData {
  email: string;
  githubUsername: string;
  companyName: string;
  useCase: string;
  marketingOptIn: boolean;
}

export function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    githubUsername: '',
    companyName: '',
    useCase: '',
    marketingOptIn: true
  });
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      return await apiRequest("POST", "/api/signups", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Welcome to SecureDep!",
        description: "You're on the early access list. We'll notify you when your account is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
          <p className="text-gray-600 mb-6">
            Thanks for signing up for early access. We'll email you when your account is ready.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            variant="outline"
            className="w-full"
          >
            Already have access? Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Get Early Access</CardTitle>
        <CardDescription>
          Join the waitlist for comprehensive dependency security monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Username
            </Label>
            <Input
              id="github"
              type="text"
              placeholder="your-github-username"
              value={formData.githubUsername}
              onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              type="text"
              placeholder="Your Company"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="useCase">Primary Use Case</Label>
            <Input
              id="useCase"
              type="text"
              placeholder="e.g., Monitor microservices security"
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="marketing"
              checked={formData.marketingOptIn}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, marketingOptIn: checked as boolean })
              }
            />
            <Label htmlFor="marketing" className="text-sm text-gray-600">
              Send me product updates and security insights
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? "Joining waitlist..." : "Join Early Access"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Already have access?</p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/auth'}
            className="w-full"
          >
            Sign In
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}