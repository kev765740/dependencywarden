import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  ExternalLink,
  GitBranch,
  Package,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

const AlertsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const alerts = [
    {
      id: 1,
      title: 'Critical SQL Injection Vulnerability',
      description: 'sequelize package contains a critical SQL injection vulnerability that allows remote code execution',
      severity: 'critical',
      package: 'sequelize',
      version: '6.21.0',
      fixedVersion: '6.28.0',
      repository: 'backend-api',
      cve: 'CVE-2023-22578',
      discoveredAt: '2 hours ago',
      status: 'open'
    },
    {
      id: 2,
      title: 'High Severity Cross-Site Scripting (XSS)',
      description: 'react-dom package vulnerable to XSS attacks through improper input sanitization',
      severity: 'high',
      package: 'react-dom',
      version: '17.0.2',
      fixedVersion: '18.2.0',
      repository: 'frontend-app',
      cve: 'CVE-2023-26048',
      discoveredAt: '4 hours ago',
      status: 'open'
    },
    {
      id: 3,
      title: 'Medium Risk: Prototype Pollution',
      description: 'lodash library susceptible to prototype pollution attacks',
      severity: 'medium',
      package: 'lodash',
      version: '4.17.19',
      fixedVersion: '4.17.21',
      repository: 'mobile-app',
      cve: 'CVE-2021-23337',
      discoveredAt: '1 day ago',
      status: 'investigating'
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600 text-white">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Open</Badge>;
      case 'investigating':
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />Investigating</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.repository.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage security vulnerabilities across your repositories</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Scan
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Zap className="w-4 h-4 mr-2" />
            Start New Scan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">1</p>
                <p className="text-sm text-gray-600">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-500">1</p>
                <p className="text-sm text-gray-600">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-600">Open Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{alert.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {alert.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(alert.severity)}
                  {getStatusBadge(alert.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Package:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{alert.package}@{alert.version}</code>
                </div>
                
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Repository:</span>
                  <span className="font-medium">{alert.repository}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Discovered:</span>
                  <span>{alert.discoveredAt}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4 text-sm">
                  {alert.cve && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">CVE:</span>
                      <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                        <a href={`https://nvd.nist.gov/vuln/detail/${alert.cve}`} target="_blank" rel="noopener noreferrer">
                          {alert.cve}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {alert.fixedVersion && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Fixed in:</span>
                      <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{alert.fixedVersion}</code>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                  {alert.status === 'open' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'All security alerts have been resolved'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
