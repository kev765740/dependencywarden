import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Clock, Users, BarChart3, Zap, CheckCircle, Play, ArrowRight, Target, Eye, Brain, Star, TrendingUp, Lock, Gauge, Github, Bell, GitBranch } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DepWatch</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <a href="/auth">Sign In</a>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <a href="/auth">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto text-center max-w-6xl">
          <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Shield className="h-4 w-4 mr-2" />
            Trusted by Fortune 500 Companies
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Automatically detect{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              security vulnerabilities
            </span>{" "}
            in your dependencies
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
            Enterprise-grade dependency monitoring with AI-powered threat detection, 
            real-time alerts, and comprehensive compliance reporting.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
              <a href="/auth">
                <Target className="h-5 w-5 mr-2" />
                Start Free Scan
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                const howItWorksSection = document.getElementById('how-it-works');
                howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play className="h-5 w-5 mr-2" />
              See How It Works
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-lg px-8 py-4 text-blue-600 hover:text-blue-700"
              onClick={() => {
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Eye className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Secure your code like Fortune 500s do
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center opacity-70">
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">TechCorp</div>
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">GlobalBank</div>
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">HealthSystem</div>
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">RetailGiant</div>
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">FinanceHub</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200">
              How It Works
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Three steps to complete security monitoring
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in minutes with our automated dependency scanning and AI-powered security insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Your Repositories</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Securely connect your GitHub repositories with one-click OAuth integration. We scan package.json, requirements.txt, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Automatic Scanning</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI engine continuously monitors your dependencies for vulnerabilities, license changes, and security issues in real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Intelligent Alerts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive actionable alerts via Slack, email, or dashboard with AI-generated fix suggestions and impact analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview Section */}
      <section id="demo" className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-purple-600 border-purple-200">
              Platform Preview
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              See DepWatch in action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive dashboards provide real-time visibility into your security posture
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-4 text-sm text-gray-500">DepWatch Enterprise Dashboard</div>
              </div>
              
              {/* Real-time Alert */}
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-red-900 dark:text-red-100">Critical Vulnerability Detected</span>
                      <Badge variant="destructive" className="text-xs">NEW</Badge>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      lodash@4.17.19 - Prototype pollution (CVE-2020-8203)
                    </p>
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <Clock className="w-3 h-3" />
                      <span>Detected 2 minutes ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-2">24</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Critical Vulnerabilities</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">98.5%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Security Score</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600 mb-2">1.2M</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dependencies Scanned</div>
                </div>
              </div>
              <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
                Interactive dashboard preview - Real data shown after login
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">10M+</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Dependencies Monitored</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Uptime SLA</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Real-time Monitoring</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Enterprise Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200">
              Complete Security Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              From basic monitoring to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                advanced threat hunting
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Seven enterprise-grade modules that provide complete coverage for your software supply chain security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">AI-Powered Security Intelligence</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Intelligent vulnerability detection with automated risk assessment and ML-powered remediation suggestions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Explore AI Security
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">Advanced Compliance & Governance</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  SOC 2, ISO 27001, and industry-specific compliance monitoring with automated reporting and audit trails.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Compliance Features
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Enterprise Integration Ecosystem</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Seamless integration with SIEM systems, DevOps tools, and identity providers for unified security orchestration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-purple-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  See Integrations
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-7 w-7 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Advanced Monitoring & Alerting</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time threat intelligence with custom alert rules, escalation workflows, and intelligent noise reduction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-orange-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Configure Monitoring
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Business Intelligence & ROI Tracking</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Executive dashboards, ROI calculations, and industry benchmarking for data-driven security decisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-indigo-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Analytics
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-100 hover:border-red-300 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-red-600" />
                </div>
                <CardTitle className="text-xl">Zero-Trust Security Architecture</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Continuous authentication, device trust scoring, and behavioral analytics for maximum security posture.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-red-600 font-medium">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Explore Zero-Trust
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Join thousands of developers protecting their code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "DepWatch reduced our security response time by 80%. The AI-powered insights are game-changing."
              </p>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Senior DevOps Engineer, TechCorp</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "Finally, a platform that understands enterprise security needs. Compliance reporting is seamless."
              </p>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CISO, GlobalBank</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "The zero-trust architecture integration saved us months of implementation time."
              </p>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Security Architect, HealthSystem</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to secure your dependencies?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of developers who trust DepWatch to protect their software supply chain. 
            Start with a free scan and see vulnerabilities in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100" asChild>
              <a href="/api/login">
                <Target className="h-5 w-5 mr-2" />
                Start Free Scan
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600">
              <Play className="h-5 w-5 mr-2" />
              See How It Works
            </Button>
          </div>
          
          <div className="mt-12 text-blue-100 text-sm">
            <p>✓ Free scan • ✓ No credit card required • ✓ Setup in 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DepWatch</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Enterprise-grade dependency monitoring and security platform trusted by Fortune 500 companies.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6">Support</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2024 DepWatch. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}