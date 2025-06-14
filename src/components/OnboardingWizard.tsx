import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, GitBranch, Shield, Zap, Users } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      title: "Welcome to Security Monitor",
      description: "Your AI-powered dependency security platform",
      content: (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Get started in 3 simple steps</h3>
            <p className="text-slate-600">Connect your repositories, scan for vulnerabilities, and get AI-powered security insights</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <GitBranch className="text-blue-600" size={20} />
              </div>
              <p className="text-sm font-medium">Connect Repos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <Zap className="text-green-600" size={20} />
              </div>
              <p className="text-sm font-medium">Auto Scan</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                <Users className="text-purple-600" size={20} />
              </div>
              <p className="text-sm font-medium">Get Insights</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your First Repository",
      description: "Start monitoring your most critical project",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Why start with your main repository?</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• See immediate security insights</li>
              <li>• Discover vulnerabilities you might have missed</li>
              <li>• Get AI-powered remediation suggestions</li>
              <li>• Establish security monitoring baseline</li>
            </ul>
          </div>
          <div className="text-center">
            <Button 
              onClick={() => {
                setCompletedSteps([...completedSteps, currentStep]);
                setCurrentStep(currentStep + 1);
              }}
              className="w-full"
            >
              Connect Repository <ArrowRight className="ml-2" size={16} />
            </Button>
            <p className="text-xs text-slate-500 mt-2">Free tier: 5 repositories included</p>
          </div>
        </div>
      )
    },
    {
      title: "Explore Pro Features",
      description: "Unlock advanced security capabilities",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg">
              <Badge variant="secondary" className="mb-2">Free</Badge>
              <ul className="space-y-1 text-sm">
                <li>• 5 repositories</li>
                <li>• Daily scans</li>
                <li>• Basic alerts</li>
                <li>• Email notifications</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-3 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600">Pro</Badge>
              <ul className="space-y-1 text-sm">
                <li>• Unlimited repositories</li>
                <li>• Real-time scanning</li>
                <li>• Advanced AI insights</li>
                <li>• Slack integration</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
          <div className="text-center space-y-2">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Start Pro Trial - 14 Days Free
            </Button>
            <p className="text-xs text-slate-500">No credit card required</p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      setCompletedSteps([...completedSteps, currentStep]);
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {steps[currentStep].content}
          
          {currentStep > 0 && (
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep !== steps.length - 1 && <ArrowRight className="ml-2" size={16} />}
              </Button>
            </div>
          )}
          
          {currentStep === 0 && (
            <Button onClick={handleNext} className="w-full mt-6">
              Start Setup <ArrowRight className="ml-2" size={16} />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}