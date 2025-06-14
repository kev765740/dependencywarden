import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Eye, 
  Lock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  MapPin,
  Network,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  RefreshCw,
  Zap
} from "lucide-react";

export default function ZeroTrustSecurity() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("behavior-analysis");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  const { data: behaviorProfiles, isLoading: behaviorLoading } = useQuery({
    queryKey: ["/api/zero-trust/behavior-profiles", selectedTimeframe],
  });

  const { data: deviceTrustScores, isLoading: deviceLoading } = useQuery({
    queryKey: ["/api/zero-trust/device-trust", selectedTimeframe],
  });

  const { data: securityPolicies, isLoading: policiesLoading } = useQuery({
    queryKey: ["/api/zero-trust/security-policies"],
  });

  const { data: riskAssessments, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/zero-trust/risk-assessments", selectedTimeframe],
  });

  const BehaviorAnalysisTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Continuous Authentication & Behavior Analysis</h3>
          <p className="text-muted-foreground">Monitor user behavior patterns and detect anomalies in real-time</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <div className="text-sm text-muted-foreground">Currently authenticated</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risk Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">18</div>
            <div className="text-sm text-muted-foreground">Requiring attention</div>
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +3 new alerts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87.3</div>
            <div className="text-sm text-muted-foreground">Average user trust</div>
            <Progress value={87.3} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Auto Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-muted-foreground">Automated responses</div>
            <div className="text-xs text-green-600 mt-1">
              92% accuracy rate
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Behavioral Risk Factors</CardTitle>
            <CardDescription>Most common anomalies detected in user behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Off-hours Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">42 incidents</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Unusual Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">28 incidents</span>
                  <Badge variant="destructive">High</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">New Device</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">67 incidents</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Suspicious Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">12 incidents</span>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time User Sessions</CardTitle>
            <CardDescription>Current authentication sessions and risk levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">john.developer@company.com</div>
                    <div className="text-xs text-muted-foreground">San Francisco, US • 2h ago</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600">Low Risk</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">sarah.admin@company.com</div>
                    <div className="text-xs text-muted-foreground">Unknown Location • 15m ago</div>
                  </div>
                </div>
                <Badge variant="secondary">Medium Risk</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">unknown.user@external.com</div>
                    <div className="text-xs text-muted-foreground">Moscow, RU • 5m ago</div>
                  </div>
                </div>
                <Badge variant="destructive">High Risk</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Behavior Timeline</CardTitle>
          <CardDescription>Authentication events and behavioral analysis over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Behavior timeline chart would be displayed here</p>
              <p className="text-xs text-gray-400">Real-time authentication and risk events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DeviceTrustTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Device Trust Scoring</h3>
          <p className="text-muted-foreground">Evaluate and monitor device security posture and trustworthiness</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Trust Policies
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Managed Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Total enrolled devices</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +34 this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Trusted Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1,089</div>
            <div className="text-sm text-muted-foreground">High trust score (&gt;80)</div>
            <div className="text-xs text-green-600 mt-1">
              87.3% of total devices
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              At-Risk Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">47</div>
            <div className="text-sm text-muted-foreground">Requiring attention</div>
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8 flagged today
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Risk Factors</CardTitle>
            <CardDescription>Common security issues identified across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Outdated Operating System</span>
                  <span className="font-medium text-orange-600">23 devices</span>
                </div>
                <Progress value={18} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Jailbroken/Rooted Devices</span>
                  <span className="font-medium text-red-600">12 devices</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Suspicious Network Connection</span>
                  <span className="font-medium text-yellow-600">31 devices</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Unknown Applications</span>
                  <span className="font-medium text-orange-600">19 devices</span>
                </div>
                <Progress value={15} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Trust Distribution</CardTitle>
            <CardDescription>Trust score breakdown across all managed devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">High Trust (90-100)</span>
                </div>
                <span className="text-sm font-medium">621 devices (49.8%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Medium Trust (70-89)</span>
                </div>
                <span className="text-sm font-medium">468 devices (37.5%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Low Trust (50-69)</span>
                </div>
                <span className="text-sm font-medium">111 devices (8.9%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Untrusted (&lt;50)</span>
                </div>
                <span className="text-sm font-medium">47 devices (3.8%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Trust Recommendations</CardTitle>
          <CardDescription>Automated recommendations to improve device security posture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  <span className="font-medium">Update Device Operating Systems</span>
                </div>
                <span className="text-sm text-muted-foreground">23 devices affected</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Multiple devices are running outdated operating systems with known security vulnerabilities
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Impact: High security risk</span>
                <span>Effort: 2-4 hours per device</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
                  <span className="font-medium">Deploy Mobile Device Management</span>
                </div>
                <span className="text-sm text-muted-foreground">87 devices affected</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Unmanaged devices should be enrolled in MDM for better security control
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Impact: Improved visibility and control</span>
                <span>Effort: 1 week implementation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SecurityPoliciesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Adaptive Security Policies</h3>
          <p className="text-muted-foreground">Dynamic security controls that adapt based on user context and risk</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Create New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <div className="text-sm text-muted-foreground">Currently enforced</div>
            <div className="text-xs text-green-600 mt-1">
              98.7% effectiveness rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Auto Adaptations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Today's adjustments</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +15% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Policy Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">23</div>
            <div className="text-sm text-muted-foreground">Blocked attempts</div>
            <div className="text-xs text-green-600 mt-1">
              100% prevention rate
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Configuration</CardTitle>
          <CardDescription>Configure adaptive security policies and their triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Multi-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Require MFA for high-risk access attempts</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Adaptive Session Timeouts</div>
                  <div className="text-sm text-muted-foreground">Adjust session duration based on risk level</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Location-Based Restrictions</div>
                  <div className="text-sm text-muted-foreground">Block access from unauthorized locations</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Device Trust Requirements</div>
                  <div className="text-sm text-muted-foreground">Minimum device trust score for access</div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Behavioral Anomaly Response</div>
                  <div className="text-sm text-muted-foreground">Automatic response to behavior anomalies</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Policy Actions</CardTitle>
          <CardDescription>Latest automated policy enforcement and adaptations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">MFA Required for High-Risk Login</div>
                  <div className="text-xs text-muted-foreground">User: sarah.admin@company.com • 15 minutes ago</div>
                </div>
              </div>
              <Badge variant="secondary">Applied</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Access Blocked - Untrusted Device</div>
                  <div className="text-xs text-muted-foreground">Device Trust Score: 25 • 32 minutes ago</div>
                </div>
              </div>
              <Badge variant="destructive">Blocked</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Session Extended - Low Risk Profile</div>
                  <div className="text-xs text-muted-foreground">Extended to 8 hours • 1 hour ago</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">Allowed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (behaviorLoading || deviceLoading || policiesLoading || riskLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Zero-Trust Security Architecture</h1>
        <p className="text-muted-foreground">
          Advanced continuous authentication and adaptive security controls based on user behavior and device trust
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Continuous Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Real-time user behavior analysis and risk-based authentication decisions
            </p>
            <Badge variant="outline">98.7% Accuracy</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Device Trust Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Comprehensive device security assessment and dynamic trust evaluation
            </p>
            <Badge variant="outline">1,247 Devices Managed</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-600" />
              Adaptive Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Intelligent security policies that adapt based on context and risk
            </p>
            <Badge variant="outline">34 Active Policies</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="behavior-analysis">Behavior Analysis</TabsTrigger>
          <TabsTrigger value="device-trust">Device Trust</TabsTrigger>
          <TabsTrigger value="security-policies">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior-analysis">
          <BehaviorAnalysisTab />
        </TabsContent>

        <TabsContent value="device-trust">
          <DeviceTrustTab />
        </TabsContent>

        <TabsContent value="security-policies">
          <SecurityPoliciesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}