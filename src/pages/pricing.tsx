import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Zap,
  Shield,
  Users,
  Building,
  Star,
  ArrowRight,
  CheckCircle,
  Brain,
  GitPullRequest,
  Lock,
  Search,
  BarChart3,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  category?: string;
}

interface PricingPlan {
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  popular?: boolean;
  icon: any;
  ctaText: string;
  ctaVariant: "default" | "secondary" | "outline";
  features: string[];
  limits: {
    repositories: string;
    scans: string;
    alerts: string;
    users: string;
  };
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [, setLocation] = useLocation();

  const handlePlanSelect = (planName: string) => {
    if (planName === "Free") {
      // For free plan, redirect to sign up or dashboard
      setLocation("/auth");
    } else {
      // For paid plans, redirect to checkout
      setLocation("/checkout");
    }
  };

  const plans: PricingPlan[] = [
    {
      name: "Free",
      description: "Perfect for individual developers and small projects",
      price: { monthly: 0, annual: 0 },
      icon: Users,
      ctaText: "Start Free",
      ctaVariant: "outline",
      features: [
        "Up to 3 repositories",
        "Basic vulnerability scanning",
        "Email notifications",
        "Community support",
        "Basic analytics"
      ],
      limits: {
        repositories: "3",
        scans: "10/month",
        alerts: "Basic",
        users: "1"
      }
    },
    {
      name: "Pro",
      description: "For growing teams and professional developers", 
      price: { monthly: 49, annual: 39 },
      popular: true,
      icon: Zap,
      ctaText: "Start Pro Trial",
      ctaVariant: "default",
      features: [
        "Unlimited repositories",
        "Advanced vulnerability scanning",
        "Security Copilot AI assistant",
        "Auto-Fix PRs generation",
        "Real-time monitoring",
        "Slack & email integrations",
        "Advanced analytics",
        "Priority support",
        "Custom alerts"
      ],
      limits: {
        repositories: "Unlimited",
        scans: "Unlimited",
        alerts: "Advanced",
        users: "Up to 10"
      }
    },
    {
      name: "Enterprise",
      description: "For large organizations with advanced security needs",
      price: { monthly: 199, annual: 159 },
      icon: Building,
      ctaText: "Contact Sales",
      ctaVariant: "secondary",
      features: [
        "Everything in Pro",
        "SOC 2 & ISO 27001 compliance",
        "Zero Trust security architecture",
        "Threat hunting & forensics",
        "Business intelligence dashboard",
        "SIEM integrations",
        "SSO & advanced user management",
        "Custom SLA",
        "Dedicated success manager",
        "On-premise deployment option"
      ],
      limits: {
        repositories: "Unlimited",
        scans: "Unlimited", 
        alerts: "Enterprise",
        users: "Unlimited"
      }
    }
  ];

  const features: PricingFeature[] = [
    // Core Features
    { name: "Repository Monitoring", free: "3 repos", pro: "Unlimited", enterprise: "Unlimited", category: "Core Features" },
    { name: "Vulnerability Scanning", free: true, pro: true, enterprise: true },
    { name: "License Compliance", free: true, pro: true, enterprise: true },
    { name: "Email Notifications", free: true, pro: true, enterprise: true },
    { name: "Basic Analytics", free: true, pro: true, enterprise: true },
    
    // AI-Powered Features
    { name: "Security Copilot AI", free: false, pro: true, enterprise: true, category: "AI Features" },
    { name: "Auto-Fix PRs", free: false, pro: true, enterprise: true },
    { name: "Risk Prioritization", free: false, pro: true, enterprise: true },
    { name: "False Positive Detection", free: false, pro: "Limited", enterprise: "Advanced" },
    
    // Integrations
    { name: "Slack Integration", free: false, pro: true, enterprise: true, category: "Integrations" },
    { name: "GitHub/GitLab", free: "Basic", pro: "Advanced", enterprise: "Advanced" },
    { name: "SIEM Integration", free: false, pro: false, enterprise: true },
    { name: "CI/CD Integration", free: false, pro: true, enterprise: true },
    { name: "Webhook Support", free: false, pro: true, enterprise: true },
    
    // Enterprise Security
    { name: "Zero Trust Architecture", free: false, pro: false, enterprise: true, category: "Enterprise Security" },
    { name: "Threat Hunting", free: false, pro: false, enterprise: true },
    { name: "SOC 2 Compliance", free: false, pro: false, enterprise: true },
    { name: "ISO 27001 Compliance", free: false, pro: false, enterprise: true },
    { name: "Advanced Monitoring", free: false, pro: "Basic", enterprise: "Advanced" },
    
    // Support & SLA
    { name: "Support Level", free: "Community", pro: "Priority", enterprise: "Dedicated", category: "Support" },
    { name: "SLA", free: "None", pro: "99.5%", enterprise: "99.9%" },
    { name: "Response Time", free: "Best effort", pro: "< 24h", enterprise: "< 4h" },
    { name: "Custom Onboarding", free: false, pro: false, enterprise: true },
  ];

  const getPrice = (plan: PricingPlan) => {
    return isAnnual ? plan.price.annual : plan.price.monthly;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return 0;
    return Math.round(((plan.price.monthly - plan.price.annual) / plan.price.monthly) * 100);
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-4 w-4 text-green-600" />;
    } else if (value === false) {
      return <X className="h-4 w-4 text-gray-400" />;
    } else {
      return <span className="text-sm text-gray-600">{value}</span>;
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, PricingFeature[]>);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Choose Your Security Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Protect your dependencies with enterprise-grade security. From individual developers to large organizations.
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <span className={cn("text-sm", !isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-500")}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-blue-600"
          />
          <span className={cn("text-sm", isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-500")}>
            Annual
          </span>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Save up to 20%
          </Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
              plan.popular && "border-blue-500 shadow-lg scale-105"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2">
                <span className="text-sm font-medium flex items-center justify-center">
                  <Star className="h-4 w-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader className={cn("text-center", plan.popular && "pt-16")}>
              <div className="flex justify-center mb-4">
                <div className={cn(
                  "p-3 rounded-full",
                  plan.name === "Free" && "bg-gray-100 dark:bg-gray-800",
                  plan.name === "Pro" && "bg-blue-100 dark:bg-blue-900",
                  plan.name === "Enterprise" && "bg-purple-100 dark:bg-purple-900"
                )}>
                  <plan.icon className={cn(
                    "h-6 w-6",
                    plan.name === "Free" && "text-gray-600 dark:text-gray-400",
                    plan.name === "Pro" && "text-blue-600 dark:text-blue-400",
                    plan.name === "Enterprise" && "text-purple-600 dark:text-purple-400"
                  )} />
                </div>
              </div>
              
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold">${getPrice(plan)}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {plan.price.monthly === 0 ? "" : "/month"}
                  </span>
                </div>
                {isAnnual && plan.price.monthly > 0 && (
                  <div className="text-sm text-green-600">
                    Save ${(plan.price.monthly - plan.price.annual) * 12}/year ({getSavings(plan)}% off)
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Limits */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Repositories:</span>
                  <div className="font-medium">{plan.limits.repositories}</div>
                </div>
                <div>
                  <span className="text-gray-500">Scans:</span>
                  <div className="font-medium">{plan.limits.scans}</div>
                </div>
                <div>
                  <span className="text-gray-500">Users:</span>
                  <div className="font-medium">{plan.limits.users}</div>
                </div>
                <div>
                  <span className="text-gray-500">Alerts:</span>
                  <div className="font-medium">{plan.limits.alerts}</div>
                </div>
              </div>
              
              <Separator />
              
              {/* Key Features */}
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* CTA Button */}
              <Button
                variant={plan.ctaVariant}
                className={cn(
                  "w-full",
                  plan.popular && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                size="lg"
                onClick={() => handlePlanSelect(plan.name)}
              >
                {plan.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {plan.name === "Enterprise" && (
                <p className="text-xs text-center text-gray-500">
                  Custom pricing available for 100+ users
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Detailed Feature Comparison
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare all features across our plans to find the perfect fit for your needs.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Features</th>
                <th className="text-center p-4 font-medium text-gray-900 dark:text-white">Free</th>
                <th className="text-center p-4 font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Pro</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Popular</Badge>
                  </div>
                </th>
                <th className="text-center p-4 font-medium text-gray-900 dark:text-white">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                <>
                  <tr key={category} className="bg-gray-25 dark:bg-gray-900">
                    <td colSpan={4} className="p-4">
                      <div className="flex items-center space-x-2">
                        {category === "AI Features" && <Brain className="h-4 w-4 text-blue-600" />}
                        {category === "Core Features" && <Shield className="h-4 w-4 text-green-600" />}
                        {category === "Integrations" && <Zap className="h-4 w-4 text-orange-600" />}
                        {category === "Enterprise Security" && <Lock className="h-4 w-4 text-purple-600" />}
                        {category === "Support" && <Users className="h-4 w-4 text-gray-600" />}
                        <span className="font-medium text-gray-900 dark:text-white">{category}</span>
                      </div>
                    </td>
                  </tr>
                  {categoryFeatures.map((feature) => (
                    <tr key={feature.name} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-4 text-gray-900 dark:text-white">{feature.name}</td>
                      <td className="p-4 text-center">{renderFeatureValue(feature.free)}</td>
                      <td className="p-4 text-center">{renderFeatureValue(feature.pro)}</td>
                      <td className="p-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unique Features Highlight */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Makes DepWatch Different
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unique AI-powered features that set us apart from the competition.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security Copilot</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Exclusive</Badge>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI-powered vulnerability assistant that explains security issues in business context and provides step-by-step mitigation strategies.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Intelligent risk assessment with business impact analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Real-time chat interface for security questions</span>
              </li>
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Code examples and remediation guidance</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <GitPullRequest className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Auto-Fix PRs</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Exclusive</Badge>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Automatically generate GitHub pull requests to patch critical dependency vulnerabilities with comprehensive testing.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span>Intelligent confidence scoring and impact assessment</span>
              </li>
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span>Configurable rules with severity and repository filters</span>
              </li>
              <li className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span>Automated testing and review workflow integration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We accept all major credit cards, PayPal, and can arrange wire transfers for Enterprise customers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, we offer a 14-day free trial for Pro plans and a 30-day trial for Enterprise plans.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How secure is my data?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We use enterprise-grade encryption, SOC 2 compliance, and never store your source code - only dependency metadata.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I use DepWatch with private repositories?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, all plans support private repositories. We only analyze dependency files, not your source code.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer custom Enterprise plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, we offer custom pricing and features for organizations with 100+ users or special requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-8 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Secure Your Dependencies?
        </h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Join thousands of developers and organizations who trust DepWatch to protect their software supply chain.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
            Schedule Demo
          </Button>
        </div>
        <p className="text-gray-400 text-sm mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  );
}