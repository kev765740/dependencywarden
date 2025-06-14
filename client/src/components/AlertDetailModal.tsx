import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode, Github, Gavel, Shield, ExternalLink, AlertTriangle } from "lucide-react";
import type { Alert, DependencyUsage } from "@shared/schema";

interface AlertDetailModalProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositoryId: number;
}

export function AlertDetailModal({ alert, open, onOpenChange, repositoryId }: AlertDetailModalProps) {
  const { toast } = useToast();
  const { data: dependencyUsage = [] } = useQuery<DependencyUsage[]>({
    queryKey: ["/api/repositories", repositoryId, "dependency-usage"],
    queryFn: async () => {
      if (!alert) return [];
      const response = await fetch(
        `/api/repositories/${repositoryId}/dependency-usage?dependency_name=${encodeURIComponent(alert.dependencyName)}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch dependency usage');
      return response.json();
    },
    enabled: open && !!alert && !!repositoryId,
    retry: false,
  });

  if (!alert) return null;

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'bg-slate-100 text-slate-800';
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getAlertTypeIcon = () => {
    return alert.alertType === 'license' ? (
      <Gavel className="text-purple-600" size={24} />
    ) : (
      <Shield className="text-red-600" size={24} />
    );
  };

  const getRecommendations = () => {
    if (alert.alertType === 'license') {
      return [
        `Review the new ${alert.newValue} license terms and implications`,
        `Consider replacing ${alert.dependencyName} with alternative libraries`,
        "Consult legal team about compatibility with your project's license",
        "Pin to the previous version if possible"
      ];
    } else {
      return [
        `Update ${alert.dependencyName} to a patched version`,
        "Review the vulnerability details and impact",
        "Implement additional security measures if update is not possible",
        "Monitor for security patches and updates"
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              {getAlertTypeIcon()}
            </div>
            <div>
              <DialogTitle>{alert.dependencyName}</DialogTitle>
              <DialogDescription>
                {alert.alertType === 'license' ? 'License change alert' : 'Security vulnerability alert'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Alert Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-medium">
                      {alert.alertType === 'license' ? 'License Change' : 'Security Vulnerability'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Severity:</span>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Detected:</span>
                    <span className="font-medium">
                      {new Date(alert.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-slate-900 mb-3">
                  {alert.alertType === 'license' ? 'License Change' : 'Vulnerability Details'}
                </h4>
                {alert.alertType === 'license' ? (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className="bg-emerald-100 text-emerald-800">{alert.oldValue}</Badge>
                      <span className="text-slate-400">→</span>
                      <Badge className="bg-red-100 text-red-800">{alert.newValue}</Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      This change may introduce copyleft requirements that could affect your project's licensing.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-red-600 mb-1">{alert.newValue}</div>
                    {alert.description && (
                      <p className="text-xs text-slate-600">{alert.description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Affected Files</h4>
            <Card>
              <div className="p-4 border-b border-slate-200">
                <h5 className="text-sm font-medium text-slate-900">
                  Files importing this dependency:
                </h5>
              </div>
              
              <div className="divide-y divide-slate-200">
                {dependencyUsage.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No usage information available. Run a scan to detect file dependencies.
                  </div>
                ) : (
                  dependencyUsage.map((usage, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileCode className="text-slate-400" size={16} />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{usage.filePath}</div>
                            <div className="text-xs text-slate-500">Line {usage.lineNumber}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                          <Github size={14} className="mr-1" />
                          View on GitHub
                          <ExternalLink size={12} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-amber-600 mt-1" size={20} />
                <div>
                  <h5 className="text-sm font-medium text-amber-800 mb-2">Recommended Actions</h5>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {getRecommendations().map((recommendation, index) => (
                      <li key={index}>• {recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
