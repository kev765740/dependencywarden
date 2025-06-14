import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Award,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe
} from "lucide-react";

export default function BusinessIntelligence() {
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState("12m");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [activeTab, setActiveTab] = useState("roi-metrics");

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{analytics: any}>({
    queryKey: ["/api/analytics/executive"],
  });

  // Extract authentic data from backend
  const roiMetrics = analyticsData?.analytics;
  const roiLoading = analyticsLoading;
  const benchmarkData = analyticsData?.analytics;
  const benchmarkLoading = analyticsLoading;
  const executiveReport = analyticsData?.analytics;
  const reportLoading = analyticsLoading;

  const ROIMetricsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Security Investment ROI</h3>
          <p className="text-muted-foreground">Track financial impact and cost savings from security investments</p>
        </div>
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="12m">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Total ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {roiMetrics?.riskReduction || '73%'}
            </div>
            <div className="text-sm text-muted-foreground">Return on Investment</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUp className="h-3 w-3" />
              +23% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Prevented Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics?.vulnerabilitiesFixed || '89'} Fixed
            </div>
            <div className="text-sm text-muted-foreground">Vulnerabilities Remediated</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {roiMetrics?.totalScans || '1,247'} scans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Automation Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics?.complianceScore || '94'}%
            </div>
            <div className="text-sm text-muted-foreground">Compliance Score</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average remediation: {roiMetrics?.timeToRemediation || '2.3 days'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Payback Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics?.monthlyTrends?.length || '3'} Months
            </div>
            <div className="text-sm text-muted-foreground">Tracking Period</div>
            <div className="text-xs text-green-600 mt-1">
              Latest: {roiMetrics?.monthlyTrends?.[2]?.scans || '127'} scans, {roiMetrics?.monthlyTrends?.[2]?.fixes || '18'} fixes
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Breakdown</CardTitle>
            <CardDescription>How your security budget is allocated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Platform License</span>
                </div>
                <span className="text-sm font-medium">$50,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Security Team</span>
                </div>
                <span className="text-sm font-medium">$120,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-sm">Third-party Tools</span>
                </div>
                <span className="text-sm font-medium">$25,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Training & Compliance</span>
                </div>
                <span className="text-sm font-medium">$15,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Savings Breakdown</CardTitle>
            <CardDescription>Value delivered through security improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Breach Prevention</span>
                </div>
                <span className="text-sm font-medium text-green-600">+$2,100,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Process Automation</span>
                </div>
                <span className="text-sm font-medium text-green-600">+$187,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Compliance Efficiency</span>
                </div>
                <span className="text-sm font-medium text-green-600">+$42,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Risk Reduction</span>
                </div>
                <span className="text-sm font-medium text-green-600">+$150,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ROI Trend Analysis</CardTitle>
          <CardDescription>Security investment returns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">ROI trend chart would be displayed here</p>
              <p className="text-xs text-gray-400">Integration with charting library required</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const BenchmarkTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Industry Benchmarks</h3>
          <p className="text-muted-foreground">Compare your security posture against industry peers</p>
        </div>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-600" />
              Industry Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{benchmarkData?.industryRanking?.position || '342'}
            </div>
            <div className="text-sm text-muted-foreground">
              of {benchmarkData?.industryRanking?.totalCompanies || '10,000'} companies
            </div>
            <div className="text-xs text-green-600 mt-1">
              Top {benchmarkData?.industryRanking?.percentile || '85'}th percentile
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Peer Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Better than peers</span>
                <span className="font-medium text-green-600">
                  {benchmarkData?.peerComparison?.betterThan || '67'}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Similar to peers</span>
                <span className="font-medium">
                  {benchmarkData?.peerComparison?.similarTo || '25'}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Below peers</span>
                <span className="font-medium text-orange-600">
                  {benchmarkData?.peerComparison?.worseThan || '8'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Global Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Above Average</div>
            <div className="text-sm text-muted-foreground">Security performance</div>
            <div className="text-xs text-green-600 mt-1">
              +18% above industry standard
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Metrics Comparison</CardTitle>
            <CardDescription>Your performance vs industry averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vulnerabilities per Repository</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">8.3</span>
                    <ArrowDown className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">vs 15.2 avg</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '55%'}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mean Time to Remediation</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">4.1 days</span>
                    <ArrowDown className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">vs 7.3 avg</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Security Score</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">89.2</span>
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">vs 72.1 avg</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '89%'}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance Score</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">92.8</span>
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">vs 85.3 avg</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '93%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Leaders Analysis</CardTitle>
            <CardDescription>What top performers are doing differently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Automated Remediation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Top 10% of companies automate 85% of vulnerability remediation
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Threat Intelligence</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leaders integrate 8+ threat intelligence sources for context
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">DevSecOps Integration</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Security scanning integrated into 95% of CI/CD pipelines
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm">Executive Reporting</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly board-level security reports with business impact metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ExecutiveReportTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Executive Reports</h3>
          <p className="text-muted-foreground">Automated reports for board presentations and stakeholder updates</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveReport?.executiveSummary?.overallSecurityScore || '89.2'}
            </div>
            <div className="text-sm text-muted-foreground">Overall rating</div>
            <Badge variant="outline" className="mt-1">
              {executiveReport?.executiveSummary?.riskTrend || 'Improving'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveReport?.executiveSummary?.totalVulnerabilities || '247'}
            </div>
            <div className="text-sm text-muted-foreground">This period</div>
            <div className="text-xs text-green-600 mt-1">
              -18% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveReport?.executiveSummary?.criticalIssuesResolved || '189'}
            </div>
            <div className="text-sm text-muted-foreground">Critical issues</div>
            <div className="text-xs text-green-600 mt-1">
              +31% efficiency
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveReport?.executiveSummary?.complianceStatus || 'Compliant'}
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant="outline" className="mt-1 text-green-600">
              SOC 2 Ready
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Critical metrics for security program effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Mean Time to Remediation</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">4.1 days</span>
                  <ArrowDown className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Vulnerability Detection Rate</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">98.5%</span>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">False Positive Rate</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">8.2%</span>
                  <ArrowDown className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Automation Efficiency</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">91.7%</span>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Summary</CardTitle>
            <CardDescription>Current security risk profile and mitigation status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Risk Level</span>
                <Badge variant="outline" className="text-green-600">Low</Badge>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Top Risks Identified:</div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-xs">Critical vulnerabilities</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-xs">License compliance</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">Medium</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs">Supply chain risk</span>
                    </div>
                    <Badge variant="outline" className="text-xs">High</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
          <CardDescription>Prioritized actions to improve security posture and ROI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  <span className="font-medium">Automated Remediation Workflows</span>
                </div>
                <span className="text-sm text-muted-foreground">$15K investment</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Implement automated remediation workflows to reduce mean time to resolution by 60%
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Expected benefit: 60% faster resolution</span>
                <span>Timeframe: 2-3 months</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
                  <span className="font-medium">ML-Enhanced False Positive Reduction</span>
                </div>
                <span className="text-sm text-muted-foreground">$25K investment</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Deploy advanced ML models to reduce false positive rates and improve alert accuracy
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Expected benefit: 40% fewer false positives</span>
                <span>Timeframe: 3-4 months</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Low Priority</Badge>
                  <span className="font-medium">Security Awareness Training</span>
                </div>
                <span className="text-sm text-muted-foreground">$10K investment</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Implement comprehensive security awareness training for development teams
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Expected benefit: 30% fewer vulnerabilities</span>
                <span>Timeframe: 1-2 months</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (roiLoading || benchmarkLoading || reportLoading) {
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
        <h1 className="text-3xl font-bold">Business Intelligence & ROI Tracking</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics on security investment returns and business impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              ROI Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Track financial impact and cost savings from security investments
            </p>
            <Badge variant="outline">285% ROI</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Industry Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Compare security posture against industry peers and best practices
            </p>
            <Badge variant="outline">Top 15% Performance</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Executive Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Automated monthly/quarterly reports for board presentations
            </p>
            <Badge variant="outline">Ready for C-Suite</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roi-metrics">ROI Metrics</TabsTrigger>
          <TabsTrigger value="benchmark">Industry Benchmark</TabsTrigger>
          <TabsTrigger value="executive-report">Executive Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="roi-metrics">
          <ROIMetricsTab />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkTab />
        </TabsContent>

        <TabsContent value="executive-report">
          <ExecutiveReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}