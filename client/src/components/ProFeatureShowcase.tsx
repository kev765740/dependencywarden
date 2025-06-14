import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Zap, Shield, Users, Bot, Clock, GitBranch, AlertTriangle, Slack, Mail, Github } from "lucide-react";

interface ProFeatureShowcaseProps {
  trigger?: React.ReactNode;
  onUpgrade?: () => void;
}

export function ProFeatureShowcase({ trigger, onUpgrade }: ProFeatureShowcaseProps) {
  const [isOpen, setIsOpen] = useState(false);

  const proFeatures = [
    {
      category: "Advanced Scanning",
      icon: <Zap className="w-5 h-5" />,
      features: [
        { name: "Real-time vulnerability detection", description: "Instant alerts when new CVEs are discovered" },
        { name: "Deep dependency analysis", description: "Scan transitive dependencies up to 10 levels deep" },
        { name: "Custom vulnerability rules", description: "Define organization-specific security policies" },
        { name: "Compliance framework scanning", description: "SOC2, GDPR, HIPAA, PCI-DSS compliance checks" }
      ]
    },
    {
      category: "AI-Powered Intelligence",
      icon: <Bot className="w-5 h-5" />,
      features: [
        { name: "Smart remediation suggestions", description: "AI-generated fix recommendations with code examples" },
        { name: "Risk prioritization", description: "ML-powered vulnerability impact scoring" },
        { name: "False positive detection", description: "Reduce alert noise by 80% with AI filtering" },
        { name: "Predictive security analytics", description: "Forecast potential security risks" }
      ]
    },
    {
      category: "Enterprise Integrations",
      icon: <Users className="w-5 h-5" />,
      features: [
        { name: "Slack & Teams integration", description: "Real-time notifications in your workspace" },
        { name: "Jira ticket creation", description: "Automatically create security tickets" },
        { name: "SIEM integration", description: "Export to Splunk, LogRhythm, QRadar" },
        { name: "API access", description: "Full REST API for custom integrations" }
      ]
    },
    {
      category: "Advanced Governance",
      icon: <Shield className="w-5 h-5" />,
      features: [
        { name: "Policy enforcement", description: "Block deployments based on security policies" },
        { name: "Audit trails", description: "Complete security event logging" },
        { name: "Role-based access", description: "Team permissions and access controls" },
        { name: "SLA management", description: "Track resolution times and SLA compliance" }
      ]
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "5 repositories",
        "Daily scans",
        "Email notifications",
        "Basic vulnerability detection",
        "Community support"
      ],
      current: true
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      features: [
        "Unlimited repositories",
        "Real-time scanning",
        "Slack integration",
        "AI-powered insights",
        "Priority support",
        "Advanced compliance",
        "Team collaboration"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      features: [
        "Everything in Pro",
        "SSO integration",
        "Custom SLA",
        "Dedicated support",
        "On-premise deployment",
        "Custom integrations",
        "Training & onboarding"
      ]
    }
  ];

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
            <Lock className="w-4 h-4 mr-2" />
            Unlock Pro Features
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unlock Advanced Security Features</DialogTitle>
            <DialogDescription>
              Upgrade to Pro for unlimited repositories, real-time scanning, and AI-powered security insights
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proFeatures.map((category) => (
                  <Card key={category.category} className="border-purple-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {category.icon}
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.features.map((feature) => (
                          <div key={feature.name} className="flex flex-col space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="font-medium text-sm">{feature.name}</span>
                            </div>
                            <p className="text-xs text-slate-600 ml-4">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to upgrade?</h3>
                    <p className="text-slate-600 text-sm">Join thousands of developers securing their code with Pro features</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setIsOpen(false);
                      onUpgrade?.();
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Start Pro Trial
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => (
                  <Card key={plan.name} className={`relative ${plan.popular ? 'border-purple-500 shadow-lg' : ''} ${plan.current ? 'border-blue-500' : ''}`}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600">
                        Most Popular
                      </Badge>
                    )}
                    {plan.current && (
                      <Badge variant="secondary" className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        Current Plan
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-slate-600 ml-1">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className={`w-full mt-6 ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                            : plan.current 
                              ? 'bg-slate-600 cursor-not-allowed' 
                              : 'bg-slate-900 hover:bg-slate-700'
                        }`}
                        disabled={plan.current}
                        onClick={() => {
                          setIsOpen(false);
                          onUpgrade?.();
                        }}
                      >
                        {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Can I cancel anytime?</p>
                    <p className="text-slate-600">Yes, cancel your subscription at any time with no penalties.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Do you offer refunds?</p>
                    <p className="text-slate-600">30-day money-back guarantee for all paid plans.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Is my data secure?</p>
                    <p className="text-slate-600">SOC2 Type II certified with enterprise-grade security.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Need help migrating?</p>
                    <p className="text-slate-600">Free migration assistance for Enterprise customers.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}