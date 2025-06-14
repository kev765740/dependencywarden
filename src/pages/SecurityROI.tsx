import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProFeatureShowcase } from "@/components/ProFeatureShowcase";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  Target,
  Download,
  Lock,
  Crown
} from "lucide-react";
import { SecurityCopilotFloat } from "@/components/SecurityCopilotFloat";

interface ROIMetrics {
  totalVulnerabilitiesFixed: number;
  developmentTimeSaved: number;
  estimatedCostSavings: number;
  averageFixTime: number;
  criticalIssuesResolved: number;
  complianceScore: number;
  teamProductivity: number;
  riskReduction: number;
}

interface TimeToResolve {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function SecurityROI() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { user } = useAuth();

  // Check subscription status to enforce Pro feature restriction
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription-status"],
    enabled: !!user,
  });

  const isProUser = subscriptionStatus && 
                   ((subscriptionStatus as any).subscriptionStatus === 'active' || 
                    (subscriptionStatus as any).subscriptionStatus === 'trialing');

  // Show Pro feature gate for Free users
  if (!isProUser) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Security ROI Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Advanced analytics and ROI tracking for enterprise security teams
          </p>
        </div>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Security ROI tracking and executive analytics require a Pro subscription
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-left">
                <h4 className="font-medium mb-2">Included in Pro:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Development time saved tracking</li>
                  <li>• Cost savings calculations</li>
                  <li>• Executive ROI reports</li>
                  <li>• Team performance metrics</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-2">Advanced Analytics:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Risk reduction measurements</li>
                  <li>• Resolution time tracking</li>
                  <li>• Compliance score monitoring</li>
                  <li>• PDF report exports</li>
                </ul>
              </div>
            </div>
            <ProFeatureShowcase
              trigger={
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              }
              onUpgrade={() => window.location.href = "/billing"}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: roiMetrics, isLoading } = useQuery<ROIMetrics>({
    queryKey: ['/api/security-roi/metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/security-roi/metrics?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch ROI metrics');
      return response.json();
    }
  });

  const { data: timeToResolve } = useQuery<TimeToResolve>({
    queryKey: ['/api/security-roi/time-to-resolve', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/security-roi/time-to-resolve?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch time to resolve data');
      return response.json();
    }
  });

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/security-roi/export?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `security-roi-report-${timeRange}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatHours = (hours: number) => 
    hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security ROI Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track development time saved and security investment returns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {[
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
              { label: '90D', value: '90d' },
              { label: '1Y', value: '1y' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === option.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(roiMetrics?.developmentTimeSaved || 0)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Automated fixes and early detection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(roiMetrics?.estimatedCostSavings || 0)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Prevented security incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities Resolved</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roiMetrics?.totalVulnerabilitiesFixed || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {roiMetrics?.criticalIssuesResolved || 0} critical issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Reduction</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roiMetrics?.riskReduction || 0}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Overall security posture improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Team Performance</span>
            </CardTitle>
            <CardDescription>
              Security-related productivity improvements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Team Productivity</span>
                <span>{roiMetrics?.teamProductivity || 0}%</span>
              </div>
              <Progress value={roiMetrics?.teamProductivity || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compliance Score</span>
                <span>{roiMetrics?.complianceScore || 0}%</span>
              </div>
              <Progress value={roiMetrics?.complianceScore || 0} className="h-2" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Fix Time</span>
              <Badge variant="secondary">{formatHours(roiMetrics?.averageFixTime || 0)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Resolution Times by Severity</span>
            </CardTitle>
            <CardDescription>
              Average time to resolve vulnerabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeToResolve && [
              { label: 'Critical', value: timeToResolve.critical, color: 'bg-red-500' },
              { label: 'High', value: timeToResolve.high, color: 'bg-orange-500' },
              { label: 'Medium', value: timeToResolve.medium, color: 'bg-yellow-500' },
              { label: 'Low', value: timeToResolve.low, color: 'bg-blue-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Badge variant="outline">{formatHours(item.value)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ROI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Return on Investment Analysis</span>
          </CardTitle>
          <CardDescription>
            Comprehensive security investment impact over {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(roiMetrics?.estimatedCostSavings || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost Avoided</p>
              <p className="text-xs text-gray-500 mt-1">
                Security incidents, compliance violations, and data breaches
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round((roiMetrics?.developmentTimeSaved || 0) / 8)} days
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Developer Time Saved</p>
              <p className="text-xs text-gray-500 mt-1">
                Automated vulnerability fixes and proactive detection
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(((roiMetrics?.estimatedCostSavings || 0) / 50000) * 100)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
              <p className="text-xs text-gray-500 mt-1">
                Return on security platform investment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SecurityCopilotFloat />
    </div>
  );
}

export default SecurityROI;