import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Lock,
  Globe,
  Activity,
  Eye,
  Target,
  Zap,
  Bell
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function EnterpriseSecurityPage() {
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('medium');
  const [huntingQuery, setHuntingQuery] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('medium');
  const [incidentDescription, setIncidentDescription] = useState('');
  const queryClient = useQueryClient();

  // Fetch real-time security threats
  const { data: securityThreats = [], isLoading: loadingThreats } = useQuery({
    queryKey: ['/api/security/threats/real-time'],
    refetchInterval: 30 * 1000 // Refresh every 30 seconds for real-time monitoring
  });

  // Fetch security incidents
  const { data: securityIncidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['/api/security/incidents']
  });

  // Fetch vulnerability assessments
  const { data: vulnerabilityAssessments = [], isLoading: loadingVulns } = useQuery({
    queryKey: ['/api/security/vulnerability-assessments']
  });

  // Fetch security policies and enforcement
  const { data: securityPolicies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ['/api/security/policies']
  });

  // Fetch threat hunting results
  const { data: threatHuntingResults = [], isLoading: loadingHunting } = useQuery({
    queryKey: ['/api/security/threat-hunting']
  });

  // Fetch security metrics
  const { data: securityMetrics = {}, isLoading: loadingMetrics } = useQuery({
    queryKey: ['/api/security/metrics']
  });

  // Create security incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (incidentData: any) => 
      apiRequest('POST', '/api/security/incidents', incidentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/incidents'] });
    }
  });

  // Update security policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (policyData: any) => 
      apiRequest('PUT', `/api/security/policies/${policyData.id}`, policyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/policies'] });
    }
  });

  // Start threat hunting mutation
  const startThreatHuntMutation = useMutation({
    mutationFn: async (huntParams: any) => 
      apiRequest('POST', '/api/security/threat-hunting/start', huntParams),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/threat-hunting'] });
    }
  });

  const handleCreateIncident = (threatData: any) => {
    createIncidentMutation.mutate({
      title: `Security Threat Detected: ${threatData.type}`,
      severity: threatData.severity,
      source: threatData.source,
      details: threatData.details
    });
  };

  const handleInvestigate = (threat: any) => {
    setSelectedThreat(threat);
    // Open investigation details
    const alertMessage = `Investigation Started:
    
Threat Type: ${threat.type}
Severity: ${threat.severity}
Source: ${threat.source}
Details: ${threat.details}
    
Initiating automated analysis and evidence collection...`;
    alert(alertMessage);
  };

  const handleViewDetails = (incident: any) => {
    const detailsMessage = `Incident Details:
    
Title: ${incident.title}
Status: ${incident.status}
Severity: ${incident.severity}
Created: ${new Date(incident.createdAt).toLocaleString()}
Description: ${incident.description}
    
Full incident report and timeline available in security dashboard.`;
    alert(detailsMessage);
  };

  const handleStartThreatHunt = () => {
    if (!huntingQuery.trim()) {
      alert('Please enter a threat hunting query');
      return;
    }
    startThreatHuntMutation.mutate({
      query: huntingQuery,
      scope: 'all_repositories',
      priority: 'high'
    });
    setHuntingQuery('');
    alert('Threat hunt initiated successfully');
  };

  const handleManualIncidentCreation = () => {
    if (!incidentTitle.trim()) {
      alert('Please provide an incident title');
      return;
    }
    createIncidentMutation.mutate({
      title: incidentTitle,
      severity: incidentSeverity,
      description: incidentDescription,
      status: 'open'
    });
    setIncidentTitle('');
    setIncidentDescription('');
    setShowIncidentDialog(false);
    alert('Security incident created successfully');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Enterprise Security Operations</h1>
          <p className="text-slate-600">Real-time security monitoring, threat detection, and incident response</p>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Critical Threats</p>
                  <p className="text-2xl font-bold text-red-700">{securityMetrics.criticalThreats || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Active Incidents</p>
                  <p className="text-2xl font-bold text-amber-700">{securityIncidents.length || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Threat Hunts</p>
                  <p className="text-2xl font-bold text-blue-700">{threatHuntingResults.length || 0}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Security Score</p>
                  <p className="text-2xl font-bold text-green-700">{securityMetrics.securityScore || 85}%</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="threats" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="threats">Real-time Threats</TabsTrigger>
            <TabsTrigger value="incidents">Incident Response</TabsTrigger>
            <TabsTrigger value="hunting">Threat Hunting</TabsTrigger>
            <TabsTrigger value="policies">Security Policies</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Real-time Threat Detection
                </CardTitle>
                <CardDescription>
                  Live monitoring of security threats across all repositories and infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingThreats ? (
                  <div className="text-center py-8">Loading threat data...</div>
                ) : securityThreats.length > 0 ? (
                  <div className="space-y-4">
                    {securityThreats.slice(0, 10).map((threat: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={threat.severity === 'critical' ? 'destructive' : 
                                           threat.severity === 'high' ? 'destructive' : 
                                           threat.severity === 'medium' ? 'default' : 'secondary'}>
                              {threat.severity || 'Medium'}
                            </Badge>
                            <div>
                              <p className="font-medium">{threat.type || 'Vulnerability Detected'}</p>
                              <p className="text-sm text-gray-600">{threat.source || 'Repository Scanner'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCreateIncident(threat)}
                            >
                              Create Incident
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleInvestigate(threat)}
                            >
                              Investigate
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {threat.details || 'Potential security vulnerability detected in dependencies'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Threats</h3>
                    <p className="text-gray-600">Your security posture is currently strong</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Security Incident Management
                </CardTitle>
                <CardDescription>
                  Track and manage security incidents through their lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingIncidents ? (
                  <div className="text-center py-8">Loading incidents...</div>
                ) : securityIncidents.length > 0 ? (
                  <div className="space-y-4">
                    {securityIncidents.map((incident: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{incident.title || `Incident #${index + 1}`}</h4>
                            <p className="text-sm text-gray-600">{incident.description || 'Security incident requiring attention'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={incident.status === 'open' ? 'destructive' : 'secondary'}>
                              {incident.status || 'Open'}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleViewDetails(incident)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Incidents</h3>
                    <p className="text-gray-600">All security incidents have been resolved</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hunting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Proactive Threat Hunting
                </CardTitle>
                <CardDescription>
                  Search for advanced persistent threats and anomalous behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter threat hunting query (e.g., suspicious network activity, unusual file access)"
                    value={huntingQuery}
                    onChange={(e) => setHuntingQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleStartThreatHunt}
                    disabled={startThreatHuntMutation.isPending || !huntingQuery.trim()}
                  >
                    Start Hunt
                  </Button>
                </div>

                {threatHuntingResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Recent Hunting Results</h4>
                    {threatHuntingResults.map((result: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{result.query || `Hunt #${index + 1}`}</h5>
                            <p className="text-sm text-gray-600">
                              {result.findings || 'No threats detected'} findings
                            </p>
                          </div>
                          <Badge variant={result.status === 'completed' ? 'secondary' : 'default'}>
                            {result.status || 'Completed'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Policy Enforcement
                </CardTitle>
                <CardDescription>
                  Manage and enforce organization-wide security policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPolicies ? (
                  <div className="text-center py-8">Loading policies...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Vulnerability Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Critical vulnerabilities</span>
                              <Badge variant="destructive">Block</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">High vulnerabilities</span>
                              <Badge variant="default">Warn</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Auto-fix enabled</span>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">License Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">GPL licenses</span>
                              <Badge variant="destructive">Block</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Commercial licenses</span>
                              <Badge variant="default">Review</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">License scanning</span>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Access Control Policy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Multi-factor Authentication</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="space-y-2">
                            <Label>Session Timeout (minutes)</Label>
                            <Input type="number" defaultValue="60" />
                          </div>
                          <div className="space-y-2">
                            <Label>Password Complexity</Label>
                            <Select defaultValue="high">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Security Monitoring & Analytics
                </CardTitle>
                <CardDescription>
                  Real-time security metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Alert Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Alert Threshold</Label>
                        <Select value={alertThreshold} onValueChange={setAlertThreshold}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Sensitivity</SelectItem>
                            <SelectItem value="medium">Medium Sensitivity</SelectItem>
                            <SelectItem value="high">High Sensitivity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notification Channels</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch defaultChecked />
                            <Label>Email Notifications</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch defaultChecked />
                            <Label>Slack Integration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label>SMS Alerts</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Security Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Mean Time to Detection</span>
                          <span className="text-sm font-medium">2.3 hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Mean Time to Response</span>
                          <span className="text-sm font-medium">45 minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Security Coverage</span>
                          <span className="text-sm font-medium">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">False Positive Rate</span>
                          <span className="text-sm font-medium">3.2%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}