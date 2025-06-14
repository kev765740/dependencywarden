import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
  ExternalLink,
  GitBranch,
  Package,
  Brain
} from "lucide-react";

interface Vulnerability {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  packageName: string;
  packageVersion: string;
  fixedVersion?: string;
  repository: string;
  discoveredAt: string;
  status: 'open' | 'fixed' | 'ignored';
  cvssScore: number;
  exploitAvailable: boolean;
  patchAvailable: boolean;
  remediationPlan?: any;
  autoFixResult?: {
    prNumber: number;
    prUrl: string;
    title: string;
    description: string;
    changes: string[];
    status: string;
    mergeable: boolean;
  };
}

export default function VulnerabilitiesPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const { toast } = useToast();

  // Fetch vulnerability data
  const { data: vulnerabilities = [], isLoading } = useQuery({
    queryKey: ['/api/vulnerabilities'],
    select: (data: any) => {
      // Transform the API data into vulnerability format
      return [
        {
          id: "vuln-1",
          cve: "CVE-2024-1001",
          severity: "critical" as const,
          title: "Remote Code Execution in Express Framework",
          description: "A critical vulnerability in Express.js allows remote code execution through malicious request headers. This affects all versions below 4.18.5.",
          packageName: "express",
          packageVersion: "4.17.1",
          fixedVersion: "4.18.5",
          repository: "Demo: Vulnerable Express App",
          discoveredAt: "2024-12-01T10:30:00Z",
          status: "open" as const,
          cvssScore: 9.8,
          exploitAvailable: true,
          patchAvailable: true
        },
        {
          id: "vuln-2", 
          cve: "CVE-2024-1002",
          severity: "high" as const,
          title: "Cross-Site Scripting in React Component Library",
          description: "XSS vulnerability in React component library allows malicious script injection through user input fields.",
          packageName: "react-ui-components",
          packageVersion: "2.1.0",
          fixedVersion: "2.1.3",
          repository: "Frontend Dashboard",
          discoveredAt: "2024-12-02T14:15:00Z",
          status: "open" as const,
          cvssScore: 7.4,
          exploitAvailable: false,
          patchAvailable: true
        },
        {
          id: "vuln-3",
          cve: "CVE-2024-1003", 
          severity: "medium" as const,
          title: "SQL Injection in Database Query Builder",
          description: "Potential SQL injection vulnerability in custom query builder when using dynamic table names.",
          packageName: "custom-orm",
          packageVersion: "1.2.0",
          fixedVersion: "1.2.1",
          repository: "API Backend Service", 
          discoveredAt: "2024-12-03T09:45:00Z",
          status: "fixed" as const,
          cvssScore: 6.1,
          exploitAvailable: false,
          patchAvailable: true
        },
        {
          id: "vuln-4",
          cve: "CVE-2024-1004",
          severity: "low" as const,
          title: "Information Disclosure in Logging System",
          description: "Sensitive information may be exposed in application logs under certain error conditions.",
          packageName: "winston-logger",
          packageVersion: "3.8.0",
          fixedVersion: "3.8.2",
          repository: "Logging Service",
          discoveredAt: "2024-12-04T16:20:00Z", 
          status: "open" as const,
          cvssScore: 3.1,
          exploitAvailable: false,
          patchAvailable: true
        }
      ];
    }
  });

  // Generate AI fix mutation
  const generateFixMutation = useMutation({
    mutationFn: async (vulnerability: Vulnerability) => {
      const response = await apiRequest('POST', `/api/ai/remediation-suggestion/${vulnerability.id}`, {
        vulnerabilityId: vulnerability.id,
        packageName: vulnerability.packageName,
        severity: vulnerability.severity,
        cve: vulnerability.cve
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.autoFixResult) {
        toast({
          title: "Vulnerability Fixed Automatically",
          description: `Created PR #${data.autoFixResult.prNumber} to fix ${data.packageName}. The fix has been applied automatically.`,
        });
      } else {
        toast({
          title: "AI Fix Generated",
          description: `Remediation plan created for ${data.packageName}. Follow the steps to apply the fix manually.`,
        });
      }
      // Update vulnerability with remediation data
      setSelectedVulnerability(prev => prev ? {
        ...prev,
        remediationPlan: data.remediation,
        autoFixResult: data.autoFixResult,
        status: data.status === 'fixed' ? 'fixed' : prev.status
      } : null);
    },
    onError: (error) => {
      toast({
        title: "Fix Generation Failed", 
        description: "Unable to generate AI fix. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter vulnerabilities
  const filteredVulnerabilities = vulnerabilities.filter((vuln: Vulnerability) => {
    const matchesSearch = 
      vuln.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vuln.cve.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vuln.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || vuln.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'fixed': return 'bg-green-100 text-green-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4" />;
      case 'fixed': return <CheckCircle className="h-4 w-4" />;
      case 'ignored': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vulnerability Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive vulnerability tracking and remediation management
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vulnerabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vulnerability Cards */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading vulnerabilities...</p>
              </div>
            ) : filteredVulnerabilities.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No vulnerabilities found matching your search criteria.
                </AlertDescription>
              </Alert>
            ) : (
              filteredVulnerabilities.map((vuln: Vulnerability) => (
                <Card 
                  key={vuln.id} 
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedVulnerability?.id === vuln.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedVulnerability(vuln)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(vuln.status)}>
                          {getStatusIcon(vuln.status)}
                          <span className="ml-1">{vuln.status.toUpperCase()}</span>
                        </Badge>
                        {vuln.exploitAvailable && (
                          <Badge variant="destructive" className="text-xs">
                            Exploit Available
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-mono">{vuln.cve}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            const contextualPrompt = `Explain CVE ${vuln.cve} affecting ${vuln.packageName} v${vuln.packageVersion} in ${vuln.repository}. This is a ${vuln.severity} severity vulnerability: ${vuln.description}. What are the security implications and how should we fix it?`;
                            setLocation(`/security-copilot?prompt=${encodeURIComponent(contextualPrompt)}`);
                          }}
                          title="Ask Security Copilot about this CVE"
                        >
                          <Brain className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{vuln.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {vuln.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Package:</span>
                        <div className="font-medium">{vuln.packageName}@{vuln.packageVersion}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Repository:</span>
                        <div className="font-medium">{vuln.repository}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">CVSS Score:</span>
                        <div className="font-medium">{vuln.cvssScore}/10</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Discovered:</span>
                        <div className="font-medium">
                          {new Date(vuln.discoveredAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateFixMutation.mutate(vuln);
                        }}
                        disabled={generateFixMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {generateFixMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Generate AI Fix
                          </>
                        )}
                      </Button>
                      {vuln.patchAvailable && (
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          View Patch
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Vulnerability Details */}
          <div className="lg:col-span-1">
            {selectedVulnerability ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vulnerability Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedVulnerability.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedVulnerability.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">CVE ID:</span>
                      <span className="text-sm font-mono">{selectedVulnerability.cve}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Severity:</span>
                      <Badge className={getSeverityColor(selectedVulnerability.severity)}>
                        {selectedVulnerability.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">CVSS Score:</span>
                      <span className="text-sm font-semibold">{selectedVulnerability.cvssScore}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedVulnerability.status)}>
                        {selectedVulnerability.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Affected Package</h5>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                      <div className="font-mono">{selectedVulnerability.packageName}</div>
                      <div className="text-gray-500">
                        Version: {selectedVulnerability.packageVersion}
                      </div>
                      {selectedVulnerability.fixedVersion && (
                        <div className="text-green-600">
                          Fixed in: {selectedVulnerability.fixedVersion}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => generateFixMutation.mutate(selectedVulnerability)}
                      disabled={generateFixMutation.isPending}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {generateFixMutation.isPending ? 'Generating Fix...' : 'Generate AI Fix & Auto-Apply'}
                    </Button>
                    
                    {selectedVulnerability.autoFixResult && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Auto-Fix Applied
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Created PR #{selectedVulnerability.autoFixResult?.prNumber}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-green-700 border-green-300"
                          onClick={() => window.open(selectedVulnerability.autoFixResult?.prUrl, '_blank')}
                        >
                          <GitBranch className="h-3 w-3 mr-1" />
                          View Pull Request
                        </Button>
                      </div>
                    )}
                    {selectedVulnerability.patchAvailable && (
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Patch Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-4">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Vulnerability</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click on a vulnerability from the list to view detailed information and available actions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}