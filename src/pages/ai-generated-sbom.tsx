import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Package, 
  Shield, 
  Calendar,
  ExternalLink,
  Filter,
  Search
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AIGeneratedSBOM() {
  const auth = useAuth();
  const { user, isAuthenticated } = auth || { user: null, isAuthenticated: false };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch repositories
  const { data: repositoriesData = [], isLoading: reposLoading } = useQuery({
    queryKey: ['/api/repositories'],
    queryFn: () => apiRequest('GET', '/api/repositories'),
    enabled: isAuthenticated,
  });
  
  // Ensure repositories is always an array, handling all possible response formats
  const repositories = React.useMemo(() => {
    if (!repositoriesData) return [];
    if (Array.isArray(repositoriesData)) return repositoriesData;
    
    // Handle wrapped responses
    const data = repositoriesData as any;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.repositories && Array.isArray(data.repositories)) return data.repositories;
    if (data.items && Array.isArray(data.items)) return data.items;
    
    // Handle single repository wrapped in array
    if (data.id && data.name) return [data];
    
    console.warn('Unexpected repositories data format:', repositoriesData);
    return [];
  }, [repositoriesData]);

  // Fetch recent SBOMs with proper session authentication
  const { data: sbomsData = [], isLoading: sbomsLoading, refetch } = useQuery({
    queryKey: ['/api/sboms/recent'],
    queryFn: async () => {
      const response = await fetch('/api/sboms/recent?limit=20', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SBOMs: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Ensure sboms is always an array
  const sboms = React.useMemo(() => {
    if (!sbomsData) return [];
    if (Array.isArray(sbomsData)) return sbomsData;
    
    // Handle wrapped responses
    const data = sbomsData as any;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.sboms && Array.isArray(data.sboms)) return data.sboms;
    if (data.items && Array.isArray(data.items)) return data.items;
    
    console.warn('Unexpected SBOMs data format:', sbomsData);
    return [];
  }, [sbomsData]);

  // Generate SBOM mutation
  const generateSBOMMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return apiRequest('GET', `/api/repositories/${repositoryId}/sbom`);
    },
    onSuccess: (data: any) => {
      toast({
        title: "SBOM Generated",
        description: `Successfully generated SPDX SBOM with ${data?.packageCount || 0} packages`,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/sboms/recent'] });
    },
    onError: (error: any) => {
      toast({
        title: "SBOM Generation Failed",
        description: error.message || "Failed to generate SBOM",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSBOM = () => {
    if (!selectedRepository) {
      toast({
        title: "Repository Required",
        description: "Please select a repository to generate SBOM",
        variant: "destructive",
      });
      return;
    }
    generateSBOMMutation.mutate(selectedRepository);
  };

  const downloadSBOM = async (repositoryId: number) => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}/sbom`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.sbom, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.sbom.name || 'sbom'}.spdx.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "SBOM Downloaded",
          description: "SPDX SBOM file downloaded successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download SBOM file",
        variant: "destructive",
      });
    }
  };

  // Filter SBOMs based on search and format
  const sbomsArray = Array.isArray(sboms) ? sboms : [];
  const filteredSBOMs = sbomsArray.filter((sbom: any) => {
    const matchesSearch = !searchQuery || 
      sbom.repository?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = formatFilter === "all" || sbom.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            AI-Generated SBOM
          </h1>
          <p className="text-slate-600">
            Generate and manage Software Bill of Materials (SBOM) using AI-powered dependency analysis
          </p>
        </div>

        {/* Generate SBOM Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Generate New SBOM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Repository
                </label>
                <Select value={selectedRepository} onValueChange={setSelectedRepository}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo: any) => (
                      <SelectItem key={repo.id} value={repo.id.toString()}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerateSBOM}
                disabled={generateSBOMMutation.isPending || !selectedRepository}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {generateSBOMMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate SBOM
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What's included in the SBOM:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Complete dependency inventory with versions</li>
                <li>• License information for each component</li>
                <li>• SPDX 2.3 compliant format</li>
                <li>• Dependency relationships and metadata</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search SBOMs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="SPDX">SPDX</SelectItem>
                  <SelectItem value="CycloneDX">CycloneDX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recent SBOMs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent SBOMs
              </span>
              <Badge variant="secondary">
                {filteredSBOMs.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sbomsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredSBOMs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SBOMs found</h3>
                <p className="text-gray-500 mb-4">
                  Generate your first SBOM to see it listed here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSBOMs.map((sbom: any) => (
                      <TableRow key={sbom.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium">
                              {sbom.repository?.name || `Repository ${sbom.repositoryId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {sbom.format || 'SPDX'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sbom.packageCount || 0} packages
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(sbom.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadSBOM(sbom.repositoryId)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/repositories/${sbom.repositoryId}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SBOM Standards Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              SBOM Standards & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">SPDX 2.3 Format</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Industry standard format</li>
                  <li>• Legal compliance ready</li>
                  <li>• Machine-readable JSON/YAML</li>
                  <li>• License identification</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Use Cases</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Security vulnerability tracking</li>
                  <li>• License compliance audits</li>
                  <li>• Supply chain transparency</li>
                  <li>• Regulatory requirements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}