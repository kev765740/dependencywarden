import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ProFeatureShowcase } from "@/components/ProFeatureShowcase";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2,
  Edit3,
  Mail,
  Lock,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["viewer", "developer", "security_admin", "admin"]),
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;
type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export default function TeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);

  // Check subscription status to enforce Pro feature restriction
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription-status"],
    enabled: !!user,
  });

  const isProUser = subscriptionStatus?.subscriptionStatus === 'active' || 
                   subscriptionStatus?.subscriptionStatus === 'trialing';

  // Show Pro feature gate for Free users
  if (!isProUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your teams, members, and collaboration settings
            </p>
          </div>
        </div>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Team collaboration and management features require a Pro subscription
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-left">
                <h4 className="font-medium mb-2">Team Management:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Create unlimited teams</li>
                  <li>• Role-based access control</li>
                  <li>• Team member invitations</li>
                  <li>• Collaboration workflows</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-2">Advanced Features:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Security admin roles</li>
                  <li>• Team notifications</li>
                  <li>• Audit logging</li>
                  <li>• Permission management</li>
                </ul>
              </div>
            </div>
            <ProFeatureShowcase
              trigger={
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Unlock Team Features
                </Button>
              }
              onUpgrade={() => window.location.href = "/billing"}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const createTeamForm = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const inviteMemberForm = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  // Fetch user's teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Fetch team members for selected team
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "members"],
    enabled: !!selectedTeam,
  });

  // Fetch team notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/teams", selectedTeam, "notifications"],
    enabled: !!selectedTeam,
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamForm) => {
      return apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setCreateTeamOpen(false);
      createTeamForm.reset();
      toast({
        title: "Team Created",
        description: "Your team has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberForm) => {
      return apiRequest("POST", `/api/teams/${selectedTeam}/invite`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "members"] });
      setInviteMemberOpen(false);
      inviteMemberForm.reset();
      toast({
        title: "Invitation Sent",
        description: "Team invitation has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      return apiRequest("PATCH", `/api/teams/members/${memberId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "members"] });
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("DELETE", `/api/teams/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "members"] });
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      owner: { color: "bg-purple-100 text-purple-800", icon: Shield },
      admin: { color: "bg-red-100 text-red-800", icon: Settings },
      security_admin: { color: "bg-orange-100 text-orange-800", icon: Shield },
      developer: { color: "bg-blue-100 text-blue-800", icon: Users },
      viewer: { color: "bg-gray-100 text-gray-800", icon: Users },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      disabled: { color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your teams, members, and collaboration settings
          </p>
        </div>
        
        <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
          <DialogTrigger asChild>
            <Button>
              <Users className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={createTeamForm.handleSubmit((data) => createTeamMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  {...createTeamForm.register("name")}
                  placeholder="Enter team name"
                />
                {createTeamForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {createTeamForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...createTeamForm.register("description")}
                  placeholder="Enter team description"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateTeamOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Teams</CardTitle>
            <CardDescription>Select a team to manage its members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teams?.map((team: any) => (
                <div
                  key={team.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTeam === team.id 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{team.name}</h4>
                    {team.ownerId === user?.id && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {team.memberCount || 0} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {selectedTeam ? "Manage team member roles and permissions" : "Select a team to view members"}
                </CardDescription>
              </div>
              
              {selectedTeam && (
                <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={inviteMemberForm.handleSubmit((data) => inviteMemberMutation.mutate(data))} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...inviteMemberForm.register("email")}
                          placeholder="Enter email address"
                        />
                        {inviteMemberForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {inviteMemberForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={inviteMemberForm.watch("role")}
                          onValueChange={(value) => inviteMemberForm.setValue("role", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                            <SelectItem value="developer">Developer - Repository management</SelectItem>
                            <SelectItem value="security_admin">Security Admin - Security policy management</SelectItem>
                            <SelectItem value="admin">Admin - Full team management</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setInviteMemberOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={inviteMemberMutation.isPending}>
                          {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTeam ? (
              membersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers?.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {member.user?.firstName?.[0] || member.user?.email?.[0] || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.user?.firstName && member.user?.lastName 
                                  ? `${member.user.firstName} ${member.user.lastName}`
                                  : member.user?.email || 'Unknown User'
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(member.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(member.status)}
                        </TableCell>
                        <TableCell>
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {member.role !== 'owner' && (
                              <>
                                <Select
                                  value={member.role}
                                  onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="developer">Developer</SelectItem>
                                    <SelectItem value="security_admin">Security Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                  disabled={removeMemberMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a team from the list to view and manage its members
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Notifications */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
            <CardDescription>Latest notifications and activity for the selected team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications?.slice(0, 5).map((notification: any) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.severity === 'critical' ? 'bg-red-500' :
                    notification.severity === 'warning' ? 'bg-yellow-500' :
                    notification.severity === 'error' ? 'bg-red-400' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}