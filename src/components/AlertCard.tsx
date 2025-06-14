import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Shield, Code, TrendingUp, Eye, EyeOff, Brain } from "lucide-react";
import { Alert } from "@shared/schema";
import { useSecurityCopilot } from "@/contexts/SecurityCopilotContext";

interface AlertCardProps {
  alert: Alert & {
    isUsedInCode?: boolean;
    usageCount?: number;
    riskScore?: number;
    repositoryName?: string;
  };
  onAskCopilot?: (contextualPrompt: string, alertContext: any) => void;
}

export function AlertCard({ alert, onAskCopilot }: AlertCardProps) {
  const { promptHandler } = useSecurityCopilot();
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return 'Very High Risk';
    if (score >= 60) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    if (score >= 20) return 'Low Risk';
    return 'Very Low Risk';
  };

  const generateContextualPrompt = () => {
    const repoName = alert.repositoryName || 'your repository';
    const severity = alert.severity.toUpperCase();
    const dependencyName = alert.dependencyName;
    const alertType = alert.alertType === 'vuln' ? 'security vulnerability' : 'license change';
    const usageContext = alert.isUsedInCode ? 
      ` (actively used ${alert.usageCount ? `${alert.usageCount} times` : ''} in code)` : 
      ' (not actively used in code)';
    
    if (alert.alertType === 'vuln') {
      return `Explain how to fix this ${severity} severity ${alertType} in ${dependencyName} from repository ${repoName}${usageContext}. ${alert.description ? `Issue details: ${alert.description}` : ''} Provide step-by-step remediation guidance and assess the business impact.`;
    } else {
      return `Analyze this license change in ${dependencyName} from repository ${repoName}${usageContext}. License changed from ${alert.oldValue || 'unknown'} to ${alert.newValue}. Explain the compliance implications and recommend actions.`;
    }
  };

  const getAlertContext = () => ({
    alertId: alert.id,
    dependencyName: alert.dependencyName,
    severity: alert.severity,
    alertType: alert.alertType,
    repositoryName: alert.repositoryName,
    isUsedInCode: alert.isUsedInCode,
    usageCount: alert.usageCount,
    riskScore: alert.riskScore,
    description: alert.description,
    oldValue: alert.oldValue,
    newValue: alert.newValue,
    createdAt: alert.createdAt
  });

  const handleAskCopilot = () => {
    if (promptHandler) {
      const prompt = generateContextualPrompt();
      const context = getAlertContext();
      promptHandler(prompt, context);
    } else if (onAskCopilot) {
      const prompt = generateContextualPrompt();
      const context = getAlertContext();
      onAskCopilot(prompt, context);
    }
  };

  return (
    <Card className="border-l-4" style={{ borderLeftColor: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : alert.severity === 'medium' ? '#eab308' : '#3b82f6' }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <CardTitle className="text-lg">{alert.dependencyName}</CardTitle>
              <Badge variant="secondary" className={`${getSeverityColor(alert.severity)} text-white`}>
                {alert.severity.toUpperCase()}
              </Badge>
              {onAskCopilot && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleAskCopilot}
                      >
                        <Brain className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ask Security Copilot about this alert</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Enhanced Risk Assessment */}
            {alert.riskScore !== undefined && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">AI Risk Score:</span>
                  <span className={`font-bold ${getRiskScoreColor(alert.riskScore)}`}>
                    {alert.riskScore}/100
                  </span>
                  <Badge variant="outline" className={getRiskScoreColor(alert.riskScore)}>
                    {getRiskScoreLabel(alert.riskScore)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Usage Analysis */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {alert.isUsedInCode ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">
                  {alert.isUsedInCode ? (
                    <span className="text-green-600 font-medium">Used in code</span>
                  ) : (
                    <span className="text-gray-500">Not used in code</span>
                  )}
                </span>
              </div>
              
              {alert.isUsedInCode && alert.usageCount && (
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">
                    {alert.usageCount} usage{alert.usageCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {alert.alertType === 'vuln' ? 'Security Vulnerability' : 'License Change'}
            </div>
            <div className="text-xs text-gray-400">
              {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'Unknown date'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {alert.description}
            </p>
          </div>
          
          {/* Smart Risk Context */}
          {!alert.isUsedInCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Lower Priority</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This dependency is not actively used in your codebase, reducing the actual security risk.
              </p>
            </div>
          )}
          
          {alert.isUsedInCode && alert.usageCount && alert.usageCount > 5 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">High Impact</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                This dependency is heavily used throughout your codebase. Consider prioritizing this fix.
              </p>
            </div>
          )}
          
          {alert.alertType === 'license' && (
            <div className="text-sm">
              <span className="font-medium">License changed:</span>
              <span className="ml-2">
                <span className="text-gray-600">{alert.oldValue || 'Unknown'}</span>
                <span className="mx-2">→</span>
                <span className="text-blue-600">{alert.newValue}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}