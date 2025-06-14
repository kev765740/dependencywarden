import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { vulnerabilityService } from '@/lib/vulnerabilityService';
import { dependencyService } from '@/lib/dependencyService';
import { teamService } from '@/lib/teamService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OptimizedContainer } from '@/components/OptimizedContainer';

export default function RepositoriesPage() {
  const { user } = useAuth();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('vulnerabilities');

  // Use our custom hooks from the services
  const { data: vulnerabilities, isLoading: loadingVulnerabilities } = 
    vulnerabilityService.useVulnerabilityScan(selectedRepo || '');
  
  const { data: dependencies, isLoading: loadingDependencies } = 
    dependencyService.useDependencyAnalysis(selectedRepo || '');
  
  const { data: updatePlan, isLoading: loadingUpdatePlan } = 
    dependencyService.useUpdatePlan(selectedRepo || '');
  
  const { data: licenseCompliance, isLoading: loadingLicenseCompliance } = 
    dependencyService.useLicenseCompliance(selectedRepo || '', 'default-policy');
  
  const { data: teamMembers, isLoading: loadingTeamMembers } = 
    teamService.useTeamMembers();

  const { data: teamActivity, isLoading: loadingTeamActivity } = 
    teamService.useTeamActivity();

  const renderVulnerabilities = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">
              {vulnerabilities?.summary.critical || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500">
              {vulnerabilities?.summary.high || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-500">
              {vulnerabilities?.summary.medium || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">
              {vulnerabilities?.summary.low || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedContainer
            virtualizeItems
            itemHeight={80}
            items={vulnerabilities?.vulnerabilities || []}
            renderItem={(vuln) => (
              <div key={vuln.id} className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{vuln.title}</h3>
                    <p className="text-sm text-gray-500">{vuln.affected.package}</p>
                  </div>
                  <Badge variant={
                    vuln.cvss.baseSeverity === 'CRITICAL' ? 'destructive' :
                    vuln.cvss.baseSeverity === 'HIGH' ? 'destructive' :
                    vuln.cvss.baseSeverity === 'MEDIUM' ? 'warning' :
                    'secondary'
                  }>
                    {vuln.cvss.baseScore.toFixed(1)}
                  </Badge>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderDependencies = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Update Summary</CardTitle>
          <CardDescription>Available updates for your dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {updatePlan?.map(update => (
              <div key={update.dependency} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{update.dependency}</div>
                  <div className="text-sm text-gray-500">
                    {update.from_version} → {update.to_version}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {update.breaking && (
                    <Badge variant="destructive">Breaking</Badge>
                  )}
                  <Button size="sm">Update</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          {licenseCompliance?.violations.map(violation => (
            <Alert key={`${violation.dependency}-${violation.violation_type}`}>
              <AlertTitle>{violation.dependency}</AlertTitle>
              <AlertDescription>{violation.description}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers?.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </div>
                <Badge>{member.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button>Invite Team Member</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamActivity?.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-2 border-b">
                <Avatar>
                  <AvatarFallback>{activity.actor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {activity.actor.name} {activity.action}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Repositories</h1>
        <Button>Add Repository</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities">
          {renderVulnerabilities()}
        </TabsContent>

        <TabsContent value="dependencies">
          {renderDependencies()}
        </TabsContent>

        <TabsContent value="team">
          {renderTeam()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 