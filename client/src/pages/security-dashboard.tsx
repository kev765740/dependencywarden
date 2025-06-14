import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Settings, 
  Zap,
  TrendingUp,
  GitPullRequest,
  Clock,
  Users,
  Download
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Security Policy Form Schema
const securityPolicySchema = z.object({
  name: z.string().min(1, "Policy name is required"),
  description: z.string().optional(),
  allowedLicenses: z.array(z.string()).optional(),
  blockedLicenses: z.array(z.string()).optional(),
  maxSeverityLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  autoRemediation: z.boolean().default(false),
  enforceCompliance: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

type SecurityPolicyForm = z.infer<typeof securityPolicySchema>;

const commonLicenses = [
  "MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "GPL-3.0", "GPL-2.0", 
  "LGPL-3.0", "LGPL-2.1", "ISC", "MPL-2.0", "CDDL-1.0", "EPL-2.0"
];

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);

  // Queries
  const { data: securityOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/security/overview"]
  });

  const { data: securityPolicies, isLoading: policiesLoading } = useQuery({
    queryKey: ["/api/security/policies"]
  });

  const { data: securityWorkflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/security/workflows"]
  });

  const { data: complianceReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/security/compliance-reports"]
  });

  const { data: remediationSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/security/remediation-suggestions"]
  });

  // Mutations
  const createPolicyMutation = useMutation({
    mutationFn: async (data: SecurityPolicyForm) => {
      return apiRequest("POST", "/api/security/policies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/security/overview"] });
      setShowCreatePolicy(false);
      toast({
        title: "Success",
        description: "Security policy created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/security/workflows", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/security/overview"] });
      setShowCreateWorkflow(false);
      toast({
        title: "Success",
        description: "Security workflow created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const applyRemediationMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      return apiRequest("POST", `/api/security/remediation-suggestions/${suggestionId}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/remediation-suggestions"] });
      toast({
        title: "Success",
        description: "Remediation applied successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form setup
  const form = useForm<SecurityPolicyForm>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: {
      name: "",
      description: "",
      allowedLicenses: [],
      blockedLicenses: [],
      maxSeverityLevel: "medium",
      autoRemediation: false,
      enforceCompliance: true,
      isActive: true
    }
  });

  const onSubmit = (data: SecurityPolicyForm) => {
    createPolicyMutation.mutate(data);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (overviewLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced security monitoring and policy enforcement
          </p>
        </div>
        <Button onClick={() => setShowCreatePolicy(true)}>
          <Shield className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityOverview?.totalPolicies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityOverview?.activePolicies || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(securityOverview?.averageComplianceScore || 0)}`}>
              {securityOverview?.averageComplianceScore || 0}%
            </div>
            <Progress value={securityOverview?.averageComplianceScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityOverview?.totalViolations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityOverview?.criticalViolations || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remediation Suggestions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityOverview?.pendingSuggestions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityOverview?.autoRemediationAvailable || 0} auto-fixable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="remediation">Remediation Suggestions</TabsTrigger>
          <TabsTrigger value="workflows">Security Workflows</TabsTrigger>
        </TabsList>

        {/* Security Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Manage license compliance rules and security standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {securityPolicies?.map((policy: any) => (
                    <div key={policy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={policy.isActive ? "default" : "secondary"}>
                              {policy.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              Max Severity: {policy.maxSeverityLevel}
                            </Badge>
                            {policy.autoRemediation && (
                              <Badge variant="outline">Auto-Remediation</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Reports Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Track security policy compliance across repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {complianceReports?.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{report.repository?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Policy: {report.policy?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getComplianceColor(report.complianceScore)}`}>
                            {report.complianceScore}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {report.violatingDependencies} violations
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-red-600 font-semibold">{report.criticalViolations}</span>
                          <span className="text-muted-foreground"> Critical</span>
                        </div>
                        <div>
                          <span className="text-orange-600 font-semibold">{report.highViolations}</span>
                          <span className="text-muted-foreground"> High</span>
                        </div>
                        <div>
                          <span className="text-yellow-600 font-semibold">{report.mediumViolations}</span>
                          <span className="text-muted-foreground"> Medium</span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-semibold">{report.lowViolations}</span>
                          <span className="text-muted-foreground"> Low</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remediation Suggestions Tab */}
        <TabsContent value="remediation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Remediation Suggestions</CardTitle>
              <CardDescription>
                AI-powered security fixes and upgrade recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {remediationSuggestions?.map((suggestion: any) => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{suggestion.dependencyName}</h3>
                            <Badge variant="outline" className={getSeverityColor(suggestion.alert?.severity)}>
                              {suggestion.alert?.severity}
                            </Badge>
                            <Badge variant="outline">
                              {suggestion.fixType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          <div className="text-sm">
                            <span className="font-medium">Current:</span> {suggestion.currentVersion}
                            {suggestion.recommendedVersion && (
                              <>
                                <span className="mx-2">→</span>
                                <span className="font-medium">Recommended:</span> {suggestion.recommendedVersion}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">
                              Confidence: {suggestion.confidence}%
                            </span>
                            {suggestion.automationAvailable && (
                              <Badge variant="outline" className="text-green-600">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-fixable
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {suggestion.automationAvailable && suggestion.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => applyRemediationMutation.mutate(suggestion.id)}
                              disabled={applyRemediationMutation.isPending}
                            >
                              <GitPullRequest className="w-4 h-4 mr-2" />
                              Apply Fix
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Automated Security Workflows</CardTitle>
                <CardDescription>
                  Configure automated responses to security events
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateWorkflow(true)}>
                <Zap className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : securityWorkflows && securityWorkflows.length > 0 ? (
                <div className="space-y-4">
                  {securityWorkflows.map((workflow: any) => (
                    <div key={workflow.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={workflow.status === 'active' ? "default" : "secondary"}>
                              {workflow.status || 'Active'}
                            </Badge>
                            <Badge variant="outline">
                              {workflow.automationLevel || 'Manual'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Workflows Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automated security workflow
                  </p>
                  <Button onClick={() => setShowCreateWorkflow(true)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Security Policy</DialogTitle>
            <DialogDescription>
              Define license compliance rules and security standards for your repositories
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enterprise Security Policy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the security policy requirements..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSeverityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Allowed Severity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maximum severity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Vulnerabilities above this level will trigger policy violations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="autoRemediation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Auto-Remediation</FormLabel>
                        <FormDescription>
                          Automatically apply security fixes when available
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enforceCompliance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Enforce Compliance</FormLabel>
                        <FormDescription>
                          Block deployments that violate this policy
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPolicyMutation.isPending}>
                  {createPolicyMutation.isPending ? "Creating..." : "Create Policy"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Security Workflow</DialogTitle>
            <DialogDescription>
              Configure automated responses to security events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <Input 
                placeholder="Critical Vulnerability Response" 
                id="workflowName"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Automatically create tickets and notify team for critical vulnerabilities"
                id="workflowDescription"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Trigger Events</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Critical Vulnerability', 'License Violation', 'Security Alert', 'Compliance Failure'].map((trigger) => (
                  <Badge key={trigger} variant="outline" className="cursor-pointer">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Automation Level</label>
              <Select defaultValue="manual">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Review</SelectItem>
                  <SelectItem value="semi">Semi-Automated</SelectItem>
                  <SelectItem value="full">Fully Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateWorkflow(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const name = (document.getElementById('workflowName') as HTMLInputElement)?.value;
                  const description = (document.getElementById('workflowDescription') as HTMLTextAreaElement)?.value;
                  
                  if (name) {
                    createWorkflowMutation.mutate({
                      name,
                      description,
                      triggers: ['Critical Vulnerability'],
                      actions: ['notify', 'create_ticket'],
                      automationLevel: 'manual'
                    });
                  }
                }}
                disabled={createWorkflowMutation.isPending}
              >
                {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}