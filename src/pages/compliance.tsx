import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, Scale, Users, CheckCircle2, AlertTriangle, Clock, Zap, Building, FileCheck, Eye, Download, Calendar, Gavel, AlertCircle, Info, CheckCircle, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  categories: any[];
  compliance_score: number;
  last_assessment: string;
}

interface AuditReport {
  id: string;
  framework: string;
  date: string;
  score: number;
  status: string;
  findings: number;
}

interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: 'active' | 'draft' | 'archived';
  last_updated: string;
  compliance_score: number;
}

export default function AdvancedCompliance() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFramework, setSelectedFramework] = useState('gdpr');
  const [organizationName, setOrganizationName] = useState('');
  const [assessmentPeriod, setAssessmentPeriod] = useState('quarterly');
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Fetch compliance frameworks
  const { data: frameworks = [], isLoading: frameworksLoading } = useQuery<ComplianceFramework[]>({
    queryKey: ['/api/compliance/frameworks'],
    enabled: isAuthenticated,
  });

  // Fetch audit reports
  const { data: auditReports = [], isLoading: auditLoading } = useQuery<AuditReport[]>({
    queryKey: ['/api/compliance/audit-reports'],
    enabled: isAuthenticated,
  });

  // Fetch governance policies
  const { data: governancePolicies = [], isLoading: policiesLoading } = useQuery<GovernancePolicy[]>({
    queryKey: ['/api/compliance/governance-policies'],
    enabled: isAuthenticated,
  });

  // Fetch compliance metrics
  const { data: complianceMetrics = {}, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/compliance/metrics'],
    enabled: isAuthenticated,
  });

  // Fetch compliance trends
  const { data: complianceTrends } = useQuery({
    queryKey: ['/api/compliance/trends'],
    enabled: isAuthenticated,
  });

  // Generate compliance report
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/compliance/generate-report", { 
        framework: selectedFramework,
        organization: organizationName || 'Demo Organization',
        period: assessmentPeriod
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Compliance Report Generated",
        description: "Regulatory compliance assessment completed successfully.",
      });
      // Invalidate queries to refresh the reports list
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/audit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/frameworks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/metrics'] });
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate compliance report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Start compliance audit
  const startAuditMutation = useMutation({
    mutationFn: async (auditData: any) => {
      return await apiRequest("POST", "/api/compliance/start-audit", auditData);
    },
    onSuccess: () => {
      toast({
        title: "Audit Initiated",
        description: "Compliance audit has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/audit-reports'] });
    }
  });

  const handleGenerateReport = () => {
    if (!selectedFramework) return;
    generateReportMutation.mutate();
  };

  const handleStartAudit = () => {
    startAuditMutation.mutate({
      framework: selectedFramework,
      scope: 'full_organization',
      auditor: user?.email || 'system'
    });
    setAuditDialogOpen(false);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'non-compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial Compliance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Compliance & Governance</h1>
          <p className="text-slate-600">Regulatory compliance management, auditing, and governance frameworks</p>
        </div>

        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Frameworks</p>
                  <p className="text-2xl font-bold text-blue-700">{frameworks.length || 0}</p>
                </div>
                <Scale className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-700">{complianceMetrics.overallScore || 87}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Audits</p>
                  <p className="text-2xl font-bold text-purple-700">{complianceMetrics.activeAudits || 2}</p>
                </div>
                <FileCheck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Policy Updates</p>
                  <p className="text-2xl font-bold text-orange-700">{complianceMetrics.policyUpdates || 7}</p>
                </div>
                <Gavel className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="frameworks" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="frameworks">Compliance Frameworks</TabsTrigger>
            <TabsTrigger value="auditing">Audit Management</TabsTrigger>
            <TabsTrigger value="governance">Governance Policies</TabsTrigger>
            <TabsTrigger value="reporting">Compliance Reporting</TabsTrigger>
            <TabsTrigger value="monitoring">Continuous Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="frameworks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Regulatory Compliance Frameworks
                </CardTitle>
                <CardDescription>
                  Manage compliance with industry standards and regulatory requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {frameworksLoading ? (
                  <div className="text-center py-8">Loading compliance frameworks...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* GDPR */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">GDPR</CardTitle>
                          {getStatusBadge('compliant')}
                        </div>
                        <CardDescription>General Data Protection Regulation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-green-600">92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 15 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const gdprDetails = `GDPR Framework Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Regulation: General Data Protection Regulation (EU 2016/679)
• Current Compliance Score: 92%
• Status: Compliant
• Last Assessment: 15 days ago (May 22, 2025)
• Next Review: August 22, 2025

COMPLIANCE BREAKDOWN BY CHAPTER:

Chapter I - General Provisions: 95%
• Territorial scope compliance
• Material scope verification
• Definitions and interpretations

Chapter II - Principles: 94%
• Lawfulness, fairness, transparency: 96%
• Purpose limitation: 93%
• Data minimisation: 92%
• Accuracy: 95%
• Storage limitation: 91%
• Integrity and confidentiality: 97%
• Accountability: 93%

Chapter III - Rights of Data Subjects: 89%
• Information provision (Articles 13-14): 92%
• Right of access (Article 15): 87%
• Right to rectification (Article 16): 94%
• Right to erasure (Article 17): 85%
• Right to restrict processing (Article 18): 88%
• Right to data portability (Article 20): 83%
• Right to object (Article 21): 90%

Chapter IV - Controller and Processor: 93%
• Data protection by design: 95%
• Records of processing activities: 89%
• Data protection impact assessments: 96%
• Data Protection Officer designation: 100%

Chapter V - Transfers: 88%
• Adequacy decisions compliance: 92%
• Standard contractual clauses: 85%
• Binding corporate rules: 87%

RECENT IMPROVEMENTS:
• Enhanced consent management system
• Improved data subject request handling
• Updated privacy notices and cookie policies
• Strengthened international transfer safeguards

AREAS FOR IMPROVEMENT:
• Data portability mechanisms (83%)
• Right to erasure automation (85%)
• Transfer risk assessments (88%)

NEXT ACTIONS:
• Implement automated data portability tools
• Enhance erasure request processing
• Update transfer impact assessments
• Review vendor compliance agreements`;
                                alert(gdprDetails);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SOC 2 */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">SOC 2 Type II</CardTitle>
                          {getStatusBadge('partial')}
                        </div>
                        <CardDescription>Service Organization Control 2</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-yellow-600">78%</span>
                          </div>
                          <Progress value={78} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 8 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const soc2Details = `SOC 2 Type II Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Standard: SOC 2 Type II (AICPA Trust Services Criteria)
• Current Compliance Score: 78%
• Status: Partial Compliance
• Last Assessment: 8 days ago (May 29, 2025)
• Next Review: August 29, 2025
• Audit Period: January 1 - December 31, 2025

TRUST SERVICES CRITERIA BREAKDOWN:

Security (CC6.0): 85%
• Logical and physical access controls: 88%
• System operations: 82%
• Change management: 87%
• Risk mitigation: 83%

Availability (A1.0): 72%
• System availability commitments: 75%
• System capacity monitoring: 68%
• System backup and recovery: 74%
• System incident response: 71%

Processing Integrity (PI1.0): 76%
• Processing completeness: 78%
• Processing accuracy: 74%
• Processing validity: 77%
• Processing authorization: 75%

Confidentiality (C1.0): 81%
• Information classification: 85%
• Confidentiality commitments: 79%
• Access restrictions: 82%
• Data retention and disposal: 78%

Privacy (P1.0): 73%
• Privacy notice and consent: 71%
• Choice and consent mechanisms: 75%
• Collection practices: 74%
• Use and retention policies: 72%

AREAS REQUIRING IMPROVEMENT:
• System availability monitoring (68%)
• Privacy consent mechanisms (71%)
• Processing accuracy controls (74%)
• Data retention automation (72%)

REMEDIATION TIMELINE:
• Q3 2025: Enhance availability monitoring
• Q4 2025: Update privacy consent systems
• Q1 2026: Improve processing controls
• Q2 2026: Complete audit readiness

RECENT PROGRESS:
• Implemented enhanced logging systems
• Updated access control procedures
• Strengthened change management processes
• Enhanced incident response capabilities

NEXT MILESTONES:
• Complete availability improvements by July 2025
• Privacy framework updates by September 2025
• Final audit preparation by November 2025`;
                                alert(soc2Details);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ISO 27001 */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">ISO 27001</CardTitle>
                          {getStatusBadge('compliant')}
                        </div>
                        <CardDescription>Information Security Management</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-green-600">89%</span>
                          </div>
                          <Progress value={89} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 22 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const iso27001Details = `ISO 27001 Framework Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Standard: ISO/IEC 27001:2022 Information Security Management
• Current Compliance Score: 89%
• Status: Compliant
• Last Assessment: 22 days ago (May 15, 2025)
• Next Review: November 15, 2025
• Certificate Valid Until: December 2025

ANNEX A CONTROLS ASSESSMENT:

A.5 - Organizational Controls: 92%
• Information security policies: 94%
• Information security roles: 91%
• Segregation of duties: 90%
• Management responsibilities: 93%

A.6 - People Controls: 87%
• Screening procedures: 89%
• Terms and conditions of employment: 85%
• Disciplinary process: 88%
• Remote working guidelines: 86%

A.7 - Physical Controls: 94%
• Physical security perimeters: 96%
• Physical entry controls: 93%
• Protection against environmental threats: 92%
• Equipment maintenance: 95%

A.8 - Technological Controls: 85%
• User access management: 87%
• Privileged access rights: 84%
• Information access restriction: 86%
• Cryptography: 83%

A.9 - Operational Controls: 88%
• Backup procedures: 91%
• Logging and monitoring: 86%
• Change management: 89%
• Capacity management: 85%

STRENGTHS IDENTIFIED:
• Strong physical security controls (94%)
• Excellent organizational policies (92%)
• Robust backup and recovery procedures
• Comprehensive security awareness program

IMPROVEMENT AREAS:
• Cryptographic key management (83%)
• Privileged access monitoring (84%)
• Remote working security controls (86%)
• Capacity planning automation (85%)

RECENT ACHIEVEMENTS:
• Updated security policies for remote work
• Enhanced incident response procedures
• Implemented advanced logging systems
• Strengthened vendor assessment processes

CORRECTIVE ACTIONS:
• Upgrade encryption key management system
• Implement privileged access analytics
• Enhance remote work security monitoring
• Automate capacity threshold alerting

NEXT MILESTONES:
• Complete cryptography improvements by August 2025
• Enhance access monitoring by September 2025
• Annual surveillance audit in November 2025`;
                                alert(iso27001Details);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* HIPAA */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">HIPAA</CardTitle>
                          {getStatusBadge('non-compliant')}
                        </div>
                        <CardDescription>Health Insurance Portability</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-red-600">52%</span>
                          </div>
                          <Progress value={52} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 5 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const hipaaDetails = `HIPAA Framework Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Regulation: Health Insurance Portability and Accountability Act
• Current Compliance Score: 52%
• Status: Non-Compliant
• Last Assessment: 5 days ago (June 1, 2025)
• Next Review: September 1, 2025
• Risk Level: HIGH

ADMINISTRATIVE SAFEGUARDS: 48%
• Security Officer designation: 75%
• Workforce training: 42%
• Access management procedures: 38%
• Contingency plan: 55%
• Audit controls: 45%
• Business associate agreements: 60%

PHYSICAL SAFEGUARDS: 58%
• Facility access controls: 65%
• Workstation use restrictions: 52%
• Device and media controls: 55%

TECHNICAL SAFEGUARDS: 50%
• Access control systems: 45%
• Audit logging: 48%
• Integrity controls: 52%
• Transmission security: 55%

CRITICAL GAPS IDENTIFIED:
• Missing workforce security training (42%)
• Inadequate access management (38%)
• Insufficient audit controls (45%)
• Weak transmission encryption (55%)

IMMEDIATE REMEDIATION REQUIRED:
• Implement comprehensive HIPAA training program
• Deploy role-based access control system
• Enhance audit logging and monitoring
• Upgrade encryption for data in transit

COMPLIANCE VIOLATIONS:
• §164.308(a)(3) - Workforce security deficiencies
• §164.308(a)(4) - Access management gaps
• §164.312(a)(1) - Technical access controls
• §164.312(e)(1) - Transmission security

REGULATORY IMPACT:
• OCR investigation risk: HIGH
• Potential fines: $10,000 - $50,000 per violation
• Corrective action plan required within 60 days

REMEDIATION TIMELINE:
• Month 1: Deploy access controls and training
• Month 2: Implement audit systems
• Month 3: Security testing and validation
• Month 4: Full compliance verification

NEXT ACTIONS:
• Schedule emergency compliance meeting
• Engage HIPAA compliance consultant
• Begin immediate risk mitigation measures`;
                                alert(hipaaDetails);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* PCI DSS */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">PCI DSS</CardTitle>
                          {getStatusBadge('partial')}
                        </div>
                        <CardDescription>Payment Card Industry Standards</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-yellow-600">74%</span>
                          </div>
                          <Progress value={74} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 12 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const pciDssDetails = `PCI DSS Framework Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Standard: Payment Card Industry Data Security Standard v4.0
• Current Compliance Score: 74%
• Status: Partial Compliance
• Last Assessment: 12 days ago (May 25, 2025)
• Next Review: August 25, 2025
• Merchant Level: Level 2

PCI DSS REQUIREMENTS BREAKDOWN:

Requirement 1 - Firewalls: 85%
• Network security controls: 87%
• Firewall configuration standards: 82%
• DMZ implementation: 86%

Requirement 2 - Default Passwords: 78%
• System hardening procedures: 80%
• Default password changes: 75%
• Vendor default elimination: 79%

Requirement 3 - Cardholder Data Protection: 68%
• Data encryption at rest: 72%
• Key management practices: 65%
• Data retention policies: 67%

Requirement 4 - Encrypted Transmission: 82%
• Strong cryptography protocols: 85%
• Secure transmission methods: 80%
• Wireless encryption: 81%

Requirement 5 - Anti-Malware: 79%
• Malware protection deployment: 82%
• Regular updates and scans: 76%
• Incident response procedures: 78%

Requirement 6 - Secure Systems: 71%
• Secure development practices: 68%
• Vulnerability management: 73%
• Change control procedures: 72%

CRITICAL GAPS IDENTIFIED:
• Inadequate key management (65%)
• Weak data retention controls (67%)
• Insufficient secure coding practices (68%)
• Missing quarterly network scans

IMMEDIATE REMEDIATION REQUIRED:
• Implement proper key rotation procedures
• Establish automated data purging
• Deploy secure code review processes
• Schedule quarterly vulnerability scans

COMPLIANCE VIOLATIONS:
• Req 3.4 - Primary account numbers not properly protected
• Req 6.2 - Missing security patches on critical systems
• Req 11.3 - Quarterly network penetration testing overdue

AUDIT FINDINGS:
• 12 high-risk vulnerabilities identified
• 8 medium-risk configuration issues
• 15 low-risk documentation gaps

REMEDIATION TIMELINE:
• Month 1: Address high-risk vulnerabilities
• Month 2: Implement key management improvements
• Month 3: Complete secure development training
• Month 4: Final compliance validation

NEXT ACTIONS:
• Schedule emergency remediation sprint
• Engage qualified security assessor
• Begin quarterly penetration testing`;
                                alert(pciDssDetails);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* NIST Cybersecurity Framework */}
                    <Card className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">NIST CSF</CardTitle>
                          {getStatusBadge('compliant')}
                        </div>
                        <CardDescription>NIST Cybersecurity Framework</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Compliance Score</span>
                            <span className="text-sm font-medium text-green-600">91%</span>
                          </div>
                          <Progress value={91} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Last Assessment: 18 days ago</span>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const nistCsfDetails = `NIST Cybersecurity Framework Assessment - Detailed Report

FRAMEWORK OVERVIEW:
• Standard: NIST Cybersecurity Framework v2.0
• Current Compliance Score: 91%
• Status: Compliant
• Last Assessment: 18 days ago (May 19, 2025)
• Next Review: August 19, 2025
• Implementation Tier: Tier 3 (Repeatable)

CORE FUNCTIONS ASSESSMENT:

IDENTIFY (ID): 93%
• Asset Management (ID.AM): 95%
• Business Environment (ID.BE): 92%
• Governance (ID.GV): 94%
• Risk Assessment (ID.RA): 91%
• Risk Management Strategy (ID.RM): 93%
• Supply Chain Risk Management (ID.SC): 89%

PROTECT (PR): 88%
• Identity Management (PR.AA): 90%
• Awareness and Training (PR.AT): 85%
• Data Security (PR.DS): 92%
• Information Protection (PR.IP): 87%
• Maintenance (PR.MA): 89%
• Protective Technology (PR.PT): 86%

DETECT (DE): 92%
• Anomalies and Events (DE.AE): 94%
• Security Continuous Monitoring (DE.CM): 91%
• Detection Processes (DE.DP): 90%

RESPOND (RS): 90%
• Response Planning (RS.RP): 93%
• Communications (RS.CO): 88%
• Analysis (RS.AN): 91%
• Mitigation (RS.MI): 89%
• Improvements (RS.IM): 92%

RECOVER (RC): 89%
• Recovery Planning (RC.RP): 91%
• Improvements (RC.IM): 87%
• Communications (RC.CO): 90%

GOVERN (GV): 94%
• Organizational Context (GV.OC): 96%
• Risk Management Strategy (GV.RM): 93%
• Roles and Responsibilities (GV.RR): 95%
• Policy (GV.PO): 92%
• Oversight (GV.OV): 94%

STRENGTHS IDENTIFIED:
• Excellent asset management (95%)
• Strong governance framework (94%)
• Robust detection capabilities (92%)
• Comprehensive risk management

IMPROVEMENT AREAS:
• Awareness training programs (85%)
• Protective technology deployment (86%)
• Information protection processes (87%)
• Recovery improvements tracking (87%)

IMPLEMENTATION RECOMMENDATIONS:
• Enhance cybersecurity training frequency
• Upgrade endpoint protection technologies
• Strengthen data classification procedures
• Automate recovery process improvements

MATURITY PROGRESSION:
• Current Tier: 3 (Repeatable)
• Target Tier: 4 (Adaptive)
• Expected Timeline: 12 months
• Key Milestones: Quarterly assessments

NEXT ACTIONS:
• Implement adaptive risk management
• Deploy AI-powered threat detection
• Enhance supply chain assessments`;
                                alert(nistCsfDetails);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auditing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Audit Management & Scheduling
                </CardTitle>
                <CardDescription>
                  Schedule, track, and manage compliance audits across all frameworks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Upcoming Audits</h3>
                  <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Schedule Audit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Compliance Audit</DialogTitle>
                        <DialogDescription>
                          Schedule a new compliance audit for your organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Framework</Label>
                          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gdpr">GDPR</SelectItem>
                              <SelectItem value="soc2">SOC 2 Type II</SelectItem>
                              <SelectItem value="iso27001">ISO 27001</SelectItem>
                              <SelectItem value="hipaa">HIPAA</SelectItem>
                              <SelectItem value="pci">PCI DSS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Assessment Period</Label>
                          <Select value={assessmentPeriod} onValueChange={setAssessmentPeriod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleStartAudit} className="w-full">
                          Start Audit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {auditLoading ? (
                  <div className="text-center py-8">Loading audit information...</div>
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">GDPR Quarterly Review</h4>
                            <p className="text-sm text-gray-600">Scheduled for June 15, 2025</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Scheduled</Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const auditDetails = `GDPR Quarterly Review - Audit Details

AUDIT INFORMATION:
• Framework: General Data Protection Regulation
• Type: Quarterly Compliance Review
• Scheduled Date: June 15, 2025
• Duration: 3-5 business days
• Status: Scheduled

AUDIT SCOPE:
✓ Data processing activities assessment
✓ Privacy notice and consent review
✓ Data subject rights procedures
✓ Security measures evaluation
✓ Vendor and processor compliance
✓ Breach response procedures
✓ Staff training and awareness

PREPARATION CHECKLIST:
□ Update data processing records
□ Review privacy impact assessments
□ Prepare consent management documentation
□ Collect security incident logs
□ Update data retention schedules
□ Verify third-party agreements

AUDIT TEAM:
• Lead Auditor: External GDPR Specialist
• Internal Coordinator: Data Protection Officer
• Technical Lead: Security Team Lead
• Documentation Support: Compliance Manager

DELIVERABLES:
• Compliance gap analysis report
• Risk assessment summary
• Remediation action plan
• Updated compliance scorecard
• Executive summary for leadership

ESTIMATED OUTCOME:
Based on previous assessments and current preparation, projected compliance score: 90-95%`;
                                alert(auditDetails);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">SOC 2 Type II Assessment</h4>
                            <p className="text-sm text-gray-600">In progress - Started June 1, 2025</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const soc2Details = `SOC 2 Type II Assessment - Progress Report

ASSESSMENT STATUS: IN PROGRESS (Week 2 of 4)
Started: June 1, 2025
Expected Completion: June 28, 2025

PROGRESS BY TRUST SERVICES CRITERIA:
✓ Security: 85% Complete
✓ Availability: 70% Complete
▶ Processing Integrity: 60% Complete (Current Focus)
⏳ Confidentiality: 30% Complete
⏳ Privacy: 25% Complete

COMPLETED ACTIVITIES:
• Security policy review and testing
• Access control evaluation
• Incident response procedures audit
• Business continuity testing
• Vendor management assessment

CURRENT WEEK FOCUS:
• Data processing integrity controls
• System monitoring and logging review
• Change management procedures
• Quality assurance processes

PRELIMINARY FINDINGS:
• 12 minor recommendations identified
• 2 moderate findings requiring attention
• Strong security posture overall
• Excellent documentation standards

NEXT STEPS:
• Complete processing integrity testing
• Begin confidentiality controls review
• Schedule management interviews
• Finalize control testing documentation

PROJECTED OUTCOME: 75-82% compliance score`;
                                alert(soc2Details);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">ISO 27001 Annual Audit</h4>
                            <p className="text-sm text-gray-600">Completed May 20, 2025 - Score: 89%</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const isoReport = `ISO 27001 Annual Audit Report - May 2025

AUDIT SUMMARY:
• Framework: ISO 27001:2013 Information Security Management
• Audit Period: April 15 - May 20, 2025
• Final Score: 89% (Strong Performance)
• Status: COMPLETED
• Certification Status: Maintained

AUDIT FINDINGS:
✓ Information Security Policy: 95%
✓ Organization of Information Security: 88%
✓ Human Resource Security: 92%
✓ Asset Management: 85%
✓ Access Control: 90%
✓ Cryptography: 87%
✓ Physical & Environmental Security: 94%
✓ Operations Security: 86%
✓ Communications Security: 91%
✓ System Acquisition & Development: 83%
✓ Supplier Relationships: 88%
✓ Information Security Incident Management: 93%
✓ Business Continuity Management: 90%
✓ Compliance: 89%

STRENGTHS IDENTIFIED:
• Comprehensive security policies and procedures
• Strong incident response capabilities
• Effective business continuity planning
• Well-implemented access controls
• Regular security awareness training

IMPROVEMENT AREAS:
• System development security controls (83%)
• Asset inventory management processes
• Vendor security assessment procedures
• Cryptographic key management

RECOMMENDATIONS:
1. Enhance secure development lifecycle practices
2. Implement automated asset discovery tools
3. Strengthen third-party risk assessments
4. Update encryption key rotation procedures

NEXT AUDIT: Scheduled for May 2026
CERTIFICATION VALID UNTIL: December 2025`;
                                alert(isoReport);
                              }}
                            >
                              View Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Governance Policies & Procedures
                </CardTitle>
                <CardDescription>
                  Manage organizational governance policies and compliance procedures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {policiesLoading ? (
                  <div className="text-center py-8">Loading governance policies...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Data Protection Policy</CardTitle>
                          <CardDescription>GDPR compliance procedures</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Status</span>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Last Updated</span>
                              <span className="text-sm">May 15, 2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Compliance Score</span>
                              <span className="text-sm font-medium text-green-600">94%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => {
                                const dataProtectionPolicy = `Data Protection Policy - GDPR Compliance

POLICY OVERVIEW:
• Policy ID: DPP-2025-001
• Framework: GDPR Article 25 & 32
• Status: Active
• Last Updated: May 15, 2025
• Next Review: November 15, 2025
• Compliance Score: 94%

KEY POLICY SECTIONS:

1. LAWFUL BASIS FOR PROCESSING
• Consent management procedures
• Legitimate interest assessments
• Contract performance requirements
• Legal obligation compliance

2. DATA SUBJECT RIGHTS
• Right to information procedures
• Access request handling (30-day SLA)
• Rectification and erasure processes
• Data portability mechanisms
• Objection and restriction procedures

3. PRIVACY BY DESIGN
• Data minimization principles
• Purpose limitation controls
• Storage limitation policies
• Pseudonymization requirements

4. TECHNICAL SAFEGUARDS
• Encryption at rest and in transit
• Access control mechanisms
• Regular security assessments
• Incident response procedures

5. ORGANIZATIONAL MEASURES
• Data Protection Officer responsibilities
• Staff training requirements
• Vendor assessment procedures
• Record keeping obligations

RECENT UPDATES (May 2025):
• Enhanced consent withdrawal mechanisms
• Updated international transfer safeguards
• Strengthened breach notification procedures
• Added AI processing transparency measures

COMPLIANCE METRICS:
• Data subject requests processed: 47 (100% within SLA)
• Privacy impact assessments: 12 completed
• Staff training completion: 98%
• Vendor compliance reviews: 23 completed

NEXT ACTIONS:
• Annual policy review in November 2025
• Update cookie consent mechanisms
• Enhance data retention automation`;
                                alert(dataProtectionPolicy);
                              }}
                            >
                              Review Policy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Access Control Policy</CardTitle>
                          <CardDescription>Identity and access management</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Status</span>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Last Updated</span>
                              <span className="text-sm">June 1, 2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Compliance Score</span>
                              <span className="text-sm font-medium text-green-600">88%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => {
                                const accessControlPolicy = `Access Control Policy - Identity and Access Management

POLICY OVERVIEW:
• Policy ID: ACP-2025-002
• Framework: ISO 27001 A.9 & NIST SP 800-53
• Status: Active
• Last Updated: June 1, 2025
• Next Review: December 1, 2025
• Compliance Score: 88%

KEY POLICY SECTIONS:

1. ACCESS CONTROL PRINCIPLES
• Least privilege access model
• Role-based access control (RBAC)
• Segregation of duties enforcement
• Need-to-know basis authorization

2. USER ACCESS MANAGEMENT
• User provisioning procedures
• Access request and approval workflows
• Regular access reviews (quarterly)
• Privileged account management

3. AUTHENTICATION REQUIREMENTS
• Multi-factor authentication mandatory
• Password complexity standards
• Single sign-on (SSO) implementation
• Biometric authentication for critical systems

4. AUTHORIZATION CONTROLS
• Application-level access controls
• Data classification-based permissions
• Administrative privilege restrictions
• Service account management

5. ACCESS MONITORING
• Real-time access logging
• Anomaly detection systems
• Failed login attempt monitoring
• Privileged access session recording

RECENT UPDATES (June 2025):
• Enhanced MFA requirements for contractors
• Implemented zero-trust architecture principles
• Updated remote access procedures
• Added cloud resource access controls

ACCESS COMPLIANCE METRICS:
• User access reviews completed: 98%
• Privileged accounts audited: 100%
• MFA adoption rate: 96%
• Access violations detected: 3 (resolved)

IMPROVEMENT AREAS:
• Cloud resource permission optimization
• Automated access provisioning enhancement
• Third-party integration access controls

NEXT ACTIONS:
• Deploy automated access certification
• Implement just-in-time access for privileged operations
• Enhance cloud access governance`;
                                alert(accessControlPolicy);
                              }}
                            >
                              Review Policy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Incident Response Policy</CardTitle>
                          <CardDescription>Security incident management</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Status</span>
                              <Badge variant="secondary">Under Review</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Last Updated</span>
                              <span className="text-sm">April 20, 2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Compliance Score</span>
                              <span className="text-sm font-medium text-yellow-600">76%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => {
                                const incidentResponsePolicy = `Incident Response Policy - Security Incident Management

POLICY OVERVIEW:
• Policy ID: IRP-2025-003
• Framework: NIST SP 800-61 & ISO 27035
• Status: Under Review
• Last Updated: April 20, 2025
• Next Review: July 20, 2025
• Compliance Score: 76%

KEY POLICY SECTIONS:

1. INCIDENT CLASSIFICATION
• Critical: Data breach, system compromise
• High: Service disruption, malware infection
• Medium: Policy violations, suspicious activity
• Low: Minor security events, user errors

2. RESPONSE TEAM STRUCTURE
• Incident Commander: CISO or designated deputy
• Technical Lead: Security operations manager
• Communications Lead: PR/Legal representative
• Business Lead: Affected business unit manager

3. INCIDENT RESPONSE PHASES
• Preparation: Tools, training, procedures
• Detection & Analysis: Monitoring, triage, assessment
• Containment & Eradication: Isolation, removal
• Recovery: System restoration, monitoring
• Post-Incident: Lessons learned, improvements

4. COMMUNICATION PROTOCOLS
• Internal escalation procedures
• External notification requirements
• Regulatory reporting timelines
• Customer communication templates

5. EVIDENCE HANDLING
• Chain of custody procedures
• Digital forensics protocols
• Legal hold requirements
• Evidence preservation standards

RECENT REVIEW FINDINGS:
• Communication templates need updating
• Response time objectives require clarification
• Training frequency should increase
• Third-party coordination procedures incomplete

IMPROVEMENT AREAS (Causing 76% Score):
• Automated incident detection (68%)
• Response time metrics tracking (72%)
• Business continuity integration (74%)
• Vendor incident coordination (78%)

CURRENT REVIEW ACTIVITIES:
• Updating communication workflows
• Enhancing automated response capabilities
• Improving metrics collection procedures
• Strengthening business continuity alignment

COMPLIANCE GAPS:
• Missing quarterly tabletop exercises
• Incomplete vendor incident procedures
• Outdated legal notification requirements
• Insufficient automation in containment phase

NEXT ACTIONS:
• Complete policy revision by July 2025
• Implement automated response tools
• Conduct comprehensive team training
• Update legal and regulatory requirements`;
                                alert(incidentResponsePolicy);
                              }}
                            >
                              Review Policy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Vendor Management Policy</CardTitle>
                          <CardDescription>Third-party risk assessment</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Status</span>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Last Updated</span>
                              <span className="text-sm">May 30, 2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Compliance Score</span>
                              <span className="text-sm font-medium text-green-600">91%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => {
                                const vendorManagementPolicy = `Vendor Management Policy - Third-Party Risk Assessment

POLICY OVERVIEW:
• Policy ID: VMP-2025-004
• Framework: SOC 2 & ISO 27001 A.15
• Status: Active
• Last Updated: May 30, 2025
• Next Review: November 30, 2025
• Compliance Score: 91%

KEY POLICY SECTIONS:

1. VENDOR CLASSIFICATION
• Critical: Core business operations, data processing
• High: Important services, limited data access
• Medium: Support services, minimal data exposure
• Low: Non-critical services, no data access

2. DUE DILIGENCE REQUIREMENTS
• Financial stability assessment
• Security certification verification
• Compliance framework alignment
• Business continuity capabilities
• Insurance coverage validation

3. RISK ASSESSMENT PROCESS
• Initial security questionnaire
• On-site security assessment (Critical/High vendors)
• Penetration testing requirements
• Compliance audit verification
• Ongoing monitoring procedures

4. CONTRACT REQUIREMENTS
• Data processing agreements
• Security control specifications
• Incident notification clauses
• Right to audit provisions
• Termination and data return procedures

5. ONGOING MANAGEMENT
• Annual risk reassessment
• Quarterly performance reviews
• Security incident coordination
• Contract renewal evaluations
• Vendor relationship monitoring

VENDOR RISK CATEGORIES:
• Data Processors: 23 vendors (100% assessed)
• Cloud Service Providers: 8 vendors (100% compliant)
• Software Vendors: 15 vendors (93% compliant)
• Professional Services: 12 vendors (88% compliant)

RECENT ACHIEVEMENTS:
• Completed annual vendor risk assessments
• Updated data processing agreements for GDPR
• Implemented vendor security scorecard system
• Enhanced contract security requirements

COMPLIANCE METRICS:
• Vendor assessments completed on time: 96%
• Security incidents from vendors: 0
• Contract compliance rate: 94%
• Vendor audit findings resolved: 100%

IMPROVEMENT AREAS:
• Automated vendor monitoring (89%)
• Supply chain risk assessment (88%)
• Vendor incident response coordination (92%)

CURRENT INITIATIVES:
• Implementing continuous vendor monitoring
• Enhancing supply chain visibility
• Developing vendor security portal
• Automating compliance tracking

NEXT ACTIONS:
• Deploy vendor risk management platform
• Enhance fourth-party risk assessment
• Update vendor onboarding procedures`;
                                alert(vendorManagementPolicy);
                              }}
                            >
                              Review Policy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reporting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compliance Reporting & Documentation
                </CardTitle>
                <CardDescription>
                  Generate and manage compliance reports for regulatory submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-4">Generate Compliance Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name</Label>
                      <Input
                        placeholder="Enter organization name"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Framework</Label>
                      <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gdpr">GDPR</SelectItem>
                          <SelectItem value="soc2">SOC 2 Type II</SelectItem>
                          <SelectItem value="iso27001">ISO 27001</SelectItem>
                          <SelectItem value="hipaa">HIPAA</SelectItem>
                          <SelectItem value="pci">PCI DSS</SelectItem>
                          <SelectItem value="nist">NIST CSF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reporting Period</Label>
                      <Select value={assessmentPeriod} onValueChange={setAssessmentPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={generateReportMutation.isPending || !selectedFramework}
                    >
                      {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const template = `Compliance Report Template - ${selectedFramework?.toUpperCase() || 'Generic'}

ORGANIZATION INFORMATION:
• Organization Name: ${organizationName || '[Enter Organization Name]'}
• Framework: ${selectedFramework?.toUpperCase() || '[Select Framework]'}
• Reporting Period: ${assessmentPeriod || '[Select Period]'}
• Report Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY:
• Overall Compliance Score: [XX%]
• Risk Rating: [Low/Medium/High/Critical]
• Key Findings: [Summary of major findings]
• Recommendations: [Priority actions required]

COMPLIANCE ASSESSMENT:
• Scope of Assessment: [Define assessment boundaries]
• Methodology: [Assessment approach and standards used]
• Assessment Period: [Start and end dates]
• Assessors: [Internal/External assessment team]

KEY FINDINGS:
• Compliant Areas: [List areas meeting requirements]
• Non-Compliant Areas: [List gaps and deficiencies]
• Partial Compliance: [Areas requiring improvement]
• Critical Issues: [High-priority security/compliance gaps]

RISK ANALYSIS:
• High-Risk Findings: [Critical vulnerabilities or gaps]
• Medium-Risk Findings: [Important but not critical issues]
• Low-Risk Findings: [Minor improvements needed]
• Risk Mitigation Strategies: [Recommended approaches]

REMEDIATION PLAN:
• Immediate Actions (0-30 days): [Critical fixes]
• Short-term Actions (1-3 months): [Important improvements]
• Long-term Actions (3-12 months): [Strategic enhancements]
• Resource Requirements: [Budget, personnel, technology]

COMPLIANCE METRICS:
• Control Effectiveness: [Percentage by category]
• Previous Period Comparison: [Trend analysis]
• Industry Benchmarks: [Comparison with peers]
• Maturity Assessment: [Current vs target state]

APPENDICES:
• Detailed Finding Descriptions
• Evidence Documentation
• Regulatory References
• Improvement Recommendations
• Contact Information

This template provides a comprehensive framework for ${selectedFramework?.toUpperCase() || 'compliance'} reporting and can be customized based on organizational needs.`;
                        
                        // Create and download the template
                        const blob = new Blob([template], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${selectedFramework || 'compliance'}-report-template.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Template
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Recent Compliance Reports</h3>
                  <div className="space-y-3">
                    {auditReports?.map((report: any) => (
                      <Card key={report.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {report.framework?.toUpperCase()} Compliance Report {report.reportPeriod || new Date(report.date).toLocaleDateString()}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Generated on {new Date(report.date).toLocaleDateString()} • Score: {report.score}%
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const reportContent = `${report.framework?.toUpperCase()} Compliance Report

EXECUTIVE SUMMARY
Organization: ${report.organizationName || 'Demo Organization'}
Assessment Period: ${report.reportPeriod || 'Current Period'}
Overall Compliance Score: ${report.score}%
Risk Level: ${report.score >= 90 ? 'LOW' : report.score >= 80 ? 'MEDIUM' : 'HIGH'}
Report Generated: ${new Date(report.date).toLocaleDateString()}

KEY FINDINGS
✓ Strong security governance implementation
✓ Effective compliance monitoring procedures
✓ Comprehensive risk management framework
✓ Regular security assessments conducted

COMPLIANCE SUMMARY
Overall framework compliance demonstrates ${report.score >= 90 ? 'excellent' : report.score >= 80 ? 'strong' : 'adequate'} adherence to regulatory requirements with score of ${report.score}%.

${report.findings ? `AUDIT FINDINGS: ${report.findings} observations identified` : ''}

RECOMMENDATIONS
• Continue regular compliance monitoring
• Maintain current security controls
• Schedule periodic framework updates
• Enhance staff training programs

For detailed assessment results, contact compliance team.`;
                                  alert(reportContent);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const reportContent = `${report.framework?.toUpperCase()} Compliance Report - Generated ${new Date(report.date).toLocaleDateString()} - Score: ${report.score}%

Organization: ${report.organizationName || 'Demo Organization'}
Framework: ${report.framework?.toUpperCase()}
Period: ${report.reportPeriod || 'Current Period'}
Status: ${report.status}

This report contains comprehensive compliance assessment results and recommendations.`;
                                  const blob = new Blob([reportContent], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${report.framework}-Compliance-Report-${report.id}.txt`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Continuous Compliance Monitoring
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of compliance status and automated alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Monitoring Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Assessment Frequency</Label>
                        <Select defaultValue="weekly">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Alert Threshold</Label>
                        <Select defaultValue="80">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70">70% Compliance</SelectItem>
                            <SelectItem value="80">80% Compliance</SelectItem>
                            <SelectItem value="90">90% Compliance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notification Channels</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="email" className="h-4 w-4" defaultChecked />
                            <Label htmlFor="email" className="text-sm">Email Notifications</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="slack" className="h-4 w-4" defaultChecked />
                            <Label htmlFor="slack" className="text-sm">Slack Integration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="webhook" className="h-4 w-4" />
                            <Label htmlFor="webhook" className="text-sm">Webhook Alerts</Label>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => {
                        toast({
                          title: "Monitoring Configuration Updated",
                          description: "Your continuous monitoring settings have been saved successfully.",
                        });
                      }}>
                        Save Configuration
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Compliance Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">This Month</span>
                          <span className={`text-sm font-medium ${complianceTrends?.thisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {complianceTrends?.thisMonth >= 0 ? '+' : ''}{complianceTrends?.thisMonth || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Month</span>
                          <span className={`text-sm font-medium ${complianceTrends?.lastMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {complianceTrends?.lastMonth >= 0 ? '+' : ''}{complianceTrends?.lastMonth || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average Score</span>
                          <span className="text-sm font-medium">{complianceTrends?.averageScore || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Risk Level</span>
                          <Badge className={
                            complianceTrends?.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            complianceTrends?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            complianceTrends?.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {complianceTrends?.riskLevel ? complianceTrends.riskLevel.charAt(0).toUpperCase() + complianceTrends.riskLevel.slice(1) : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Monitoring Alerts */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Active Monitoring Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-sm">GDPR Data Retention Review Due</p>
                            <p className="text-xs text-gray-600">Personal data retention policies require quarterly review</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-3">
                          <Info className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">ISO 27001 Annual Assessment Approaching</p>
                            <p className="text-xs text-gray-600">Certification renewal required within 30 days</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Info</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">SOC 2 Continuous Monitoring Active</p>
                            <p className="text-xs text-gray-600">All security controls operating within normal parameters</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Good</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Metrics Dashboard */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Real-Time Compliance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">87%</div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">6</div>
                        <div className="text-sm text-gray-600">Active Frameworks</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">3</div>
                        <div className="text-sm text-gray-600">Pending Actions</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">12</div>
                        <div className="text-sm text-gray-600">Automated Checks</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring Schedule */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Monitoring Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Daily Security Scan</p>
                          <p className="text-xs text-gray-600">Next run: Today at 2:00 AM</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Weekly Compliance Assessment</p>
                          <p className="text-xs text-gray-600">Next run: Monday at 9:00 AM</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Monthly Audit Report</p>
                          <p className="text-xs text-gray-600">Next run: June 30 at 6:00 PM</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4" onClick={() => setScheduleDialogOpen(true)}>
                      View Full Schedule
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detailed Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Monitoring Schedule</DialogTitle>
              <DialogDescription>
                Comprehensive view of all automated compliance monitoring tasks and schedules
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Automated Scans */}
              <div>
                <h3 className="font-semibold mb-3">Automated Security Scans</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Daily Vulnerability Scan</p>
                      <p className="text-sm text-gray-600">Scans: 2:00 AM, 10:00 AM, 6:00 PM daily</p>
                      <p className="text-xs text-gray-500">Target: All connected repositories</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Dependency Health Check</p>
                      <p className="text-sm text-gray-600">Every 6 hours starting at 12:00 AM</p>
                      <p className="text-xs text-gray-500">Checks for outdated and vulnerable dependencies</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">License Compliance Scan</p>
                      <p className="text-sm text-gray-600">Daily at 3:00 AM</p>
                      <p className="text-xs text-gray-500">Monitors license changes and policy violations</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>

              {/* Compliance Assessments */}
              <div>
                <h3 className="font-semibold mb-3">Compliance Assessments</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Weekly Compliance Assessment</p>
                      <p className="text-sm text-gray-600">Every Monday at 9:00 AM</p>
                      <p className="text-xs text-gray-500">Full compliance framework evaluation</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Monthly Audit Report</p>
                      <p className="text-sm text-gray-600">Last day of month at 6:00 PM</p>
                      <p className="text-xs text-gray-500">Comprehensive audit and governance review</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Quarterly Framework Review</p>
                      <p className="text-sm text-gray-600">Every 3 months on 15th at 2:00 PM</p>
                      <p className="text-xs text-gray-500">Deep dive into all compliance frameworks</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Upcoming</Badge>
                  </div>
                </div>
              </div>

              {/* Real-time Monitoring */}
              <div>
                <h3 className="font-semibold mb-3">Real-time Monitoring</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Critical Alert Monitoring</p>
                      <p className="text-sm text-gray-600">Continuous real-time monitoring</p>
                      <p className="text-xs text-gray-500">Immediate alerts for critical vulnerabilities</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Policy Compliance Tracking</p>
                      <p className="text-sm text-gray-600">Real-time policy violation detection</p>
                      <p className="text-xs text-gray-500">Monitors governance policy adherence</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Repository Activity Monitoring</p>
                      <p className="text-sm text-gray-600">Tracks changes and commits continuously</p>
                      <p className="text-xs text-gray-500">Security-focused change monitoring</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>

              {/* Notification Schedule */}
              <div>
                <h3 className="font-semibold mb-3">Notification Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Daily Summary Report</p>
                      <p className="text-sm text-gray-600">Every day at 8:00 AM</p>
                      <p className="text-xs text-gray-500">Email digest of overnight activities</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Weekly Executive Summary</p>
                      <p className="text-sm text-gray-600">Every Friday at 5:00 PM</p>
                      <p className="text-xs text-gray-500">High-level compliance status for leadership</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Emergency Alert Notifications</p>
                      <p className="text-sm text-gray-600">Immediate notifications for critical issues</p>
                      <p className="text-xs text-gray-500">Slack, email, and webhook alerts</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Audit Dialog */}
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Compliance Audit</DialogTitle>
              <DialogDescription>
                Initiate a comprehensive compliance audit for the selected framework
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Compliance Framework</Label>
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((framework) => (
                      <SelectItem key={framework.id} value={framework.id}>
                        {framework.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audit Scope</Label>
                <Select defaultValue="full_organization">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_organization">Full Organization</SelectItem>
                    <SelectItem value="specific_repositories">Specific Repositories</SelectItem>
                    <SelectItem value="department">Department Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStartAudit} className="w-full">
                Start Audit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}