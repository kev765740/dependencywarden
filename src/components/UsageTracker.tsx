import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Crown, ArrowUp, AlertTriangle } from "lucide-react";

interface UsageTrackerProps {
  currentRepos: number;
  maxRepos: number;
  subscriptionStatus: string;
  onUpgrade?: () => void;
}

export function UsageTracker({ currentRepos, maxRepos, subscriptionStatus, onUpgrade }: UsageTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const usagePercentage = (currentRepos / maxRepos) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentRepos >= maxRepos;
  
  const getProgressColor = () => {
    if (usagePercentage >= 100) return "bg-red-500";
    if (usagePercentage >= 80) return "bg-amber-500";
    return "bg-blue-500";
  };

  const getUrgencyMessage = () => {
    if (isAtLimit) {
      return {
        title: "Repository limit reached",
        description: "Upgrade to Pro to add unlimited repositories and unlock advanced features.",
        variant: "destructive" as const,
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }
    
    if (isNearLimit) {
      return {
        title: "Approaching repository limit",
        description: `You're using ${currentRepos} of ${maxRepos} repositories. Consider upgrading to Pro.`,
        variant: "default" as const,
        icon: <Zap className="h-4 w-4" />
      };
    }
    
    return null;
  };

  const urgencyMessage = getUrgencyMessage();

  if (subscriptionStatus === 'pro' || subscriptionStatus === 'active') {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Crown className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Pro Plan</h3>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">Active</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentRepos} repositories • Unlimited scanning • Real-time alerts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className={`${isAtLimit ? 'border-red-200 bg-red-50 dark:bg-red-950/30' : isNearLimit ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Repository Usage</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentRepos} of {maxRepos} repositories used
                </p>
              </div>
              <Badge variant="outline">Free Plan</Badge>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={Math.min(usagePercentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{currentRepos} used</span>
                <span>{maxRepos - currentRepos} remaining</span>
              </div>
            </div>

            {(isNearLimit || isExpanded) && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">Free Plan</p>
                    <ul className="space-y-1 text-slate-500">
                      <li>• {maxRepos} repositories</li>
                      <li>• Daily scans</li>
                      <li>• Email alerts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600">Pro Plan</p>
                    <ul className="space-y-1 text-slate-500">
                      <li>• Unlimited repos</li>
                      <li>• Real-time scans</li>
                      <li>• Slack integration</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
                
                <Button 
                  onClick={onUpgrade}
                  className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="sm"
                >
                  <Crown className="mr-2" size={14} />
                  Upgrade to Pro
                </Button>
              </div>
            )}

            {!isNearLimit && !isExpanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(true)}
                className="w-full"
              >
                <ArrowUp className="mr-2" size={14} />
                See Pro Features
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {urgencyMessage && (
        <Alert variant={urgencyMessage.variant}>
          {urgencyMessage.icon}
          <AlertDescription>
            <strong>{urgencyMessage.title}</strong><br />
            {urgencyMessage.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}