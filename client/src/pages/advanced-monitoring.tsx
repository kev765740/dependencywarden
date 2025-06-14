import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  Activity,
  Bell,
  Settings,
  Zap,
  Eye,
  ArrowUp,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdvancedMonitoring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("threat-intelligence");

  const { data: escalationStatus, isLoading: escalationLoading } = useQuery({
    queryKey: ["/api/monitoring/escalation-status"],
  });

  const enrichThreatIntelMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest("POST", `/api/monitoring/threat-intelligence/${alertId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Threat Intelligence Updated",
        description: "Alert has been enriched with the latest threat intelligence data",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
    onError: () => {
      toast({
        title: "Enhancement Failed",
        description: "Unable to enrich alert with threat intelligence",
        variant: "destructive",
      });
    },
  });

  const processEscalationsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/monitoring/process-escalations");
    },
    onSuccess: () => {
      toast({
        title: "Escalations Processed",
        description: "All escalation workflows have been evaluated and processed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/escalation-status"] });
    },
    onError: () => {
      toast({
        title: "Processing Failed", 
        description: "Unable to process escalation workflows",
        variant: "destructive",
      });
    },
  });

  const ThreatIntelligenceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Real-time Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">CVE Coverage</span>
                <span className="text-sm font-medium">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Intelligence Sources</span>
                <span className="text-sm font-medium">12 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Data Freshness</span>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Weaponized CVEs</span>
                <Badge variant="destructive" className="text-xs">23</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Exploit Activity</span>
                <Badge variant="destructive" className="text-xs">5 High</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Threat Actors</span>
                <Badge variant="secondary" className="text-xs">8 Tracked</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Intelligence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <div className="text-sm text-muted-foreground">Confidence Level</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUp className="h-3 w-3" />
                +2.1% from last week
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Threat Intelligence Sources</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => enrichThreatIntelMutation.mutate(1)}
              disabled={enrichThreatIntelMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${enrichThreatIntelMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh Intelligence
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time threat intelligence from multiple authoritative sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "MITRE CVE", status: "active", coverage: "100%", latency: "< 1min" },
              { name: "NVD", status: "active", coverage: "100%", latency: "< 5min" },
              { name: "CISA KEV", status: "active", coverage: "95%", latency: "< 15min" },
              { name: "ExploitDB", status: "active", coverage: "85%", latency: "< 30min" },
              { name: "VulnDB", status: "active", coverage: "90%", latency: "< 10min" },
              { name: "Rapid7", status: "limited", coverage: "60%", latency: "< 1hr" },
              { name: "Qualys", status: "active", coverage: "88%", latency: "< 20min" },
              { name: "Tenable", status: "active", coverage: "92%", latency: "< 15min" }
            ].map((source, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{source.name}</span>
                  <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {source.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Coverage: {source.coverage}</div>
                  <div>Latency: {source.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Threat Intelligence Updates</CardTitle>
          <CardDescription>Latest intelligence correlated with your dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                cve: "CVE-2024-1234",
                package: "express",
                threatLevel: "critical",
                exploitAvailable: true,
                threatActors: ["APT29", "Lazarus"],
                industries: ["Technology", "Finance"],
                timestamp: "2 minutes ago"
              },
              {
                cve: "CVE-2024-5678",
                package: "lodash",
                threatLevel: "high",
                exploitAvailable: false,
                threatActors: ["Unknown"],
                industries: ["Healthcare", "Government"],
                timestamp: "15 minutes ago"
              },
              {
                cve: "CVE-2024-9012",
                package: "react",
                threatLevel: "medium",
                exploitAvailable: true,
                threatActors: [],
                industries: ["E-commerce"],
                timestamp: "1 hour ago"
              }
            ].map((intel, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{intel.cve}</Badge>
                    <span className="font-medium">{intel.package}</span>
                    <Badge variant={
                      intel.threatLevel === 'critical' ? 'destructive' :
                      intel.threatLevel === 'high' ? 'destructive' :
                      intel.threatLevel === 'medium' ? 'default' : 'secondary'
                    }>
                      {intel.threatLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Exploit: {intel.exploitAvailable ? 'Available' : 'None'}</span>
                    {intel.threatActors.length > 0 && (
                      <span>Actors: {intel.threatActors.join(', ')}</span>
                    )}
                    <span>{intel.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {intel.exploitAvailable && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Active Exploit
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CustomRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Custom Alert Rules</h3>
          <p className="text-muted-foreground">Configure intelligent alerting based on multiple conditions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Alert Rule</DialogTitle>
              <DialogDescription>
                Define conditions and actions for intelligent alert processing
              </DialogDescription>
            </DialogHeader>
            <CustomRuleForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Custom rules configured</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Triggered Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <div className="text-sm text-muted-foreground">Rule executions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground">Noise reduction</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Alert Rules</CardTitle>
          <CardDescription>Manage your custom alert rules and their conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Critical Dependencies with Exploits",
                description: "High severity vulnerabilities with active exploits in production dependencies",
                conditions: ["Severity: Critical", "Exploit Available: Yes", "Usage: Production"],
                actions: ["Email CTO", "Slack #security", "Auto-ticket"],
                triggeredCount: 23,
                isActive: true
              },
              {
                name: "License Compliance Violations",
                description: "GPL licenses detected in commercial projects",
                conditions: ["License: GPL*", "Project Type: Commercial", "Usage: High"],
                actions: ["Email Legal", "Block Deployment"],
                triggeredCount: 5,
                isActive: true
              },
              {
                name: "Threat Actor Targeting",
                description: "CVEs with active threat actor campaigns targeting our industry",
                conditions: ["Threat Actors: Active", "Industry: Technology", "CVSS: >7.0"],
                actions: ["SOC Alert", "Executive Brief"],
                triggeredCount: 8,
                isActive: true
              },
              {
                name: "Aging Vulnerabilities",
                description: "Unresolved critical vulnerabilities older than 7 days",
                conditions: ["Age: >7 days", "Status: Open", "Severity: Critical/High"],
                actions: ["Escalate to Manager", "Daily Reminder"],
                triggeredCount: 12,
                isActive: false
              }
            ].map((rule, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rule.triggeredCount} triggered</Badge>
                    <Switch checked={rule.isActive} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Conditions:</div>
                    <div className="space-y-1">
                      {rule.conditions.map((condition, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs mr-1">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Actions:</div>
                    <div className="space-y-1">
                      {rule.actions.map((action, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs mr-1">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EscalationTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Escalation Workflows</h3>
          <p className="text-muted-foreground">Automated escalation based on SLA breaches and business impact</p>
        </div>
        <Button
          onClick={() => processEscalationsMutation.mutate()}
          disabled={processEscalationsMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${processEscalationsMutation.isPending ? 'animate-spin' : ''}`} />
          Process Escalations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Active Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalationStatus?.activeEscalations || 0}</div>
            <div className="text-sm text-muted-foreground">In progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalationStatus?.resolvedEscalations || 0}</div>
            <div className="text-sm text-muted-foreground">This month</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalationStatus?.averageEscalationTime || 0}h</div>
            <div className="text-sm text-muted-foreground">To resolution</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalationStatus?.escalationRules || 0}</div>
            <div className="text-sm text-muted-foreground">Configured</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escalation Timeline</CardTitle>
          <CardDescription>Recent escalation activities and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                alert: "CVE-2024-1234 in express",
                level: "Level 2",
                trigger: "SLA Breach (4h)",
                action: "Escalated to Security Team",
                status: "resolved",
                timestamp: "2 hours ago"
              },
              {
                alert: "License violation in lodash",
                level: "Level 1",
                trigger: "High Priority",
                action: "Notified Development Team",
                status: "in_progress", 
                timestamp: "6 hours ago"
              },
              {
                alert: "CVE-2024-5678 in react",
                level: "Level 3",
                trigger: "Business Critical",
                action: "Executive Notification",
                status: "resolved",
                timestamp: "1 day ago"
              }
            ].map((escalation, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{escalation.alert}</span>
                    <Badge variant="outline">{escalation.level}</Badge>
                    <Badge variant={escalation.status === 'resolved' ? 'default' : 'secondary'}>
                      {escalation.status === 'resolved' ? 'Resolved' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Trigger: {escalation.trigger}</span>
                    <span>Action: {escalation.action}</span>
                    <span>{escalation.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {escalation.status === 'resolved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (escalationLoading) {
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
        <h1 className="text-3xl font-bold">Advanced Monitoring & Alerting</h1>
        <p className="text-muted-foreground">
          Real-time threat intelligence, custom alert rules, and automated escalation workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Threat Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Real-time correlation with active exploits and threat actor campaigns
            </p>
            <Badge variant="outline">12 Sources Active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Custom Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Intelligent alerting based on multiple conditions and business context
            </p>
            <Badge variant="outline">12 Rules Configured</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Escalation Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Automated escalation paths based on SLA breaches and business impact
            </p>
            <Badge variant="outline">{escalationStatus?.activeEscalations || 0} Active</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="threat-intelligence">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="custom-rules">Custom Rules</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="threat-intelligence">
          <ThreatIntelligenceTab />
        </TabsContent>

        <TabsContent value="custom-rules">
          <CustomRulesTab />
        </TabsContent>

        <TabsContent value="escalation">
          <EscalationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomRuleForm() {
  const [ruleName, setRuleName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySlack, setNotifySlack] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rule-name">Rule Name</Label>
          <Input
            id="rule-name"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g., Critical Dependencies with Exploits"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="severity">Minimum Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe when this rule should trigger..."
        />
      </div>

      <div className="space-y-3">
        <Label>Notification Actions</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
            <Label>Send Email Notification</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={notifySlack} onCheckedChange={setNotifySlack} />
            <Label>Send Slack Notification</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create Rule</Button>
      </div>
    </div>
  );
}