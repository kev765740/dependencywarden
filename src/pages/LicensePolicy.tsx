import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Scale, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Edit, 
  Trash2,
  Shield,
  FileText,
  Ban
} from "lucide-react";
import { SecurityCopilotFloat } from "@/components/SecurityCopilotFloat";

interface LicensePolicy {
  id: number;
  name: string;
  description?: string;
  allowedLicenses: string[];
  blockedLicenses: string[];
  requireApproval: string[];
  isActive: boolean;
  repositories: number[];
}

interface LicenseViolation {
  id: number;
  repository: string;
  packageName: string;
  packageVersion: string;
  license: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'approved' | 'fixed';
  detectedAt: string;
}

const commonLicenses = [
  { name: 'MIT', type: 'permissive', risk: 'low' },
  { name: 'Apache-2.0', type: 'permissive', risk: 'low' },
  { name: 'BSD-3-Clause', type: 'permissive', risk: 'low' },
  { name: 'GPL-3.0', type: 'copyleft', risk: 'high' },
  { name: 'GPL-2.0', type: 'copyleft', risk: 'high' },
  { name: 'AGPL-3.0', type: 'copyleft', risk: 'critical' },
  { name: 'LGPL-2.1', type: 'weak-copyleft', risk: 'medium' },
  { name: 'MPL-2.0', type: 'weak-copyleft', risk: 'medium' },
  { name: 'CC0-1.0', type: 'public-domain', risk: 'low' },
  { name: 'Unlicense', type: 'public-domain', risk: 'low' }
];

export function LicensePolicy() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LicensePolicy | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies, isLoading } = useQuery<LicensePolicy[]>({
    queryKey: ['/api/license-policies'],
    queryFn: async () => {
      const response = await fetch('/api/license-policies', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch license policies');
      return response.json();
    }
  });

  const { data: violations } = useQuery<LicenseViolation[]>({
    queryKey: ['/api/license-violations'],
    queryFn: async () => {
      const response = await fetch('/api/license-violations', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch license violations');
      return response.json();
    }
  });

  const createPolicyMutation = useMutation({
    mutationFn: async (policy: Omit<LicensePolicy, 'id'>) => {
      const response = await fetch('/api/license-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(policy)
      });
      if (!response.ok) throw new Error('Failed to create policy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/license-policies'] });
      setIsCreating(false);
      toast({
        title: "Policy Created",
        description: "License policy has been created successfully."
      });
    }
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (policy: LicensePolicy) => {
      const response = await fetch(`/api/license-policies/${policy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(policy)
      });
      if (!response.ok) throw new Error('Failed to update policy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/license-policies'] });
      setEditingPolicy(null);
      toast({
        title: "Policy Updated",
        description: "License policy has been updated successfully."
      });
    }
  });

  const deletePolicyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/license-policies/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete policy');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/license-policies'] });
      toast({
        title: "Policy Deleted",
        description: "License policy has been deleted successfully."
      });
    }
  });

  const PolicyForm = ({ policy, onSave, onCancel }: {
    policy?: LicensePolicy;
    onSave: (policy: Omit<LicensePolicy, 'id'> | LicensePolicy) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: policy?.name || '',
      description: policy?.description || '',
      allowedLicenses: policy?.allowedLicenses || [],
      blockedLicenses: policy?.blockedLicenses || [],
      requireApproval: policy?.requireApproval || [],
      isActive: policy?.isActive ?? true,
      repositories: policy?.repositories || []
    });

    const [newLicense, setNewLicense] = useState('');

    const addLicense = (category: 'allowed' | 'blocked' | 'approval') => {
      if (!newLicense.trim()) return;

      const key = category === 'allowed' ? 'allowedLicenses' : 
                  category === 'blocked' ? 'blockedLicenses' : 'requireApproval';

      if (!formData[key].includes(newLicense)) {
        setFormData(prev => ({
          ...prev,
          [key]: [...prev[key], newLicense]
        }));
      }
      setNewLicense('');
    };

    const removeLicense = (category: 'allowed' | 'blocked' | 'approval', license: string) => {
      const key = category === 'allowed' ? 'allowedLicenses' : 
                  category === 'blocked' ? 'blockedLicenses' : 'requireApproval';

      setFormData(prev => ({
        ...prev,
        [key]: prev[key].filter(l => l !== license)
      }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (policy) {
        onSave({ ...policy, ...formData });
      } else {
        onSave(formData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Production Dependencies Policy"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and scope of this policy..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="active">Policy Active</Label>
          </div>
        </div>

        <div className="space-y-6">
          {/* Allowed Licenses */}
          <div>
            <Label className="text-sm font-medium text-green-700 dark:text-green-400">
              Allowed Licenses (Auto-approved)
            </Label>
            <div className="flex space-x-2 mt-2">
              <Select value={newLicense} onValueChange={setNewLicense}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select or type license..." />
                </SelectTrigger>
                <SelectContent>
                  {commonLicenses.filter(l => l.risk === 'low').map((license) => (
                    <SelectItem key={license.name} value={license.name}>
                      {license.name} ({license.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => addLicense('allowed')} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.allowedLicenses.map((license) => (
                <Badge key={license} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {license}
                  <button
                    type="button"
                    onClick={() => removeLicense('allowed', license)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Blocked Licenses */}
          <div>
            <Label className="text-sm font-medium text-red-700 dark:text-red-400">
              Blocked Licenses (Prohibited)
            </Label>
            <div className="flex space-x-2 mt-2">
              <Select value={newLicense} onValueChange={setNewLicense}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select or type license..." />
                </SelectTrigger>
                <SelectContent>
                  {commonLicenses.filter(l => l.risk === 'high' || l.risk === 'critical').map((license) => (
                    <SelectItem key={license.name} value={license.name}>
                      {license.name} ({license.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => addLicense('blocked')} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.blockedLicenses.map((license) => (
                <Badge key={license} variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {license}
                  <button
                    type="button"
                    onClick={() => removeLicense('blocked', license)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Require Approval */}
          <div>
            <Label className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Require Manual Approval
            </Label>
            <div className="flex space-x-2 mt-2">
              <Select value={newLicense} onValueChange={setNewLicense}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select or type license..." />
                </SelectTrigger>
                <SelectContent>
                  {commonLicenses.filter(l => l.risk === 'medium').map((license) => (
                    <SelectItem key={license.name} value={license.name}>
                      {license.name} ({license.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => addLicense('approval')} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requireApproval.map((license) => (
                <Badge key={license} variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {license}
                  <button
                    type="button"
                    onClick={() => removeLicense('approval', license)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {policy ? 'Update Policy' : 'Create Policy'}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">License Policy Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure license policies to automatically block GPL/AGPL and manage compliance
          </p>
        </div>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create License Policy</DialogTitle>
            </DialogHeader>
            <PolicyForm
              onSave={(policy) => createPolicyMutation.mutate(policy)}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Policy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{policies?.filter(p => p.isActive).length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{violations?.filter(v => v.status === 'open').length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Violations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Ban className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {policies?.reduce((acc, p) => acc + p.blockedLicenses.length, 0) || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Blocked Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policies?.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Scale className="h-5 w-5" />
                    <span>{policy.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {policy.description || 'No description provided'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Allowed</p>
                  <p className="text-2xl font-bold">{policy.allowedLicenses.length}</p>
                </div>
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">Blocked</p>
                  <p className="text-2xl font-bold">{policy.blockedLicenses.length}</p>
                </div>
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">Approval</p>
                  <p className="text-2xl font-bold">{policy.requireApproval.length}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Dialog open={editingPolicy?.id === policy.id} onOpenChange={(open) => {
                  if (!open) setEditingPolicy(null);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditingPolicy(policy)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit License Policy</DialogTitle>
                    </DialogHeader>
                    <PolicyForm
                      policy={editingPolicy!}
                      onSave={(policy) => updatePolicyMutation.mutate(policy as LicensePolicy)}
                      onCancel={() => setEditingPolicy(null)}
                    />
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deletePolicyMutation.mutate(policy.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* License Violations */}
      {violations && violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>License Violations</span>
            </CardTitle>
            <CardDescription>
              Dependencies that violate your license policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.slice(0, 5).map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="text-xs">
                        {violation.license}
                      </Badge>
                      <span className="font-medium">{violation.packageName}</span>
                      <span className="text-gray-500">v{violation.packageVersion}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {violation.repository}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      violation.severity === 'critical' ? 'destructive' :
                      violation.severity === 'high' ? 'destructive' :
                      violation.severity === 'medium' ? 'default' : 'secondary'
                    }>
                      {violation.severity}
                    </Badge>
                    <Badge variant="outline">
                      {violation.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {violations.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {violations.length - 5} more violations...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <SecurityCopilotFloat />
    </div>
  );
}

export default LicensePolicy;