import { db } from "./db";
import { 
  teams, 
  teamMembers, 
  teamRepositories, 
  teamNotifications,
  alertAssignments,
  type Team,
  type TeamMember,
  type InsertTeam,
  type InsertTeamMember,
  type InsertTeamNotification
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { emailService } from "./emailService";

export class TeamService {
  
  /**
   * Create a new team
   */
  async createTeam(ownerId: string, teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams)
      .values({
        ...teamData,
        ownerId
      })
      .returning();

    // Add owner as team member
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: ownerId,
      role: 'owner',
      status: 'active'
    });

    return team;
  }

  /**
   * Get teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams = await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.status, 'active')
      ),
      with: {
        team: {
          with: {
            members: true
          }
        }
      }
    });

    return userTeams.map(ut => ({
      ...ut.team,
      memberCount: ut.team.members.length
    }));
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: number, requesterId: string): Promise<TeamMember[]> {
    // Check if requester has access to this team
    const requesterMember = await this.getTeamMember(teamId, requesterId);
    if (!requesterMember) {
      throw new Error('Access denied');
    }

    return await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, teamId),
      with: {
        user: true
      },
      orderBy: [desc(teamMembers.joinedAt)]
    });
  }

  /**
   * Get team member by user ID
   */
  async getTeamMember(teamId: number, userId: string): Promise<TeamMember | null> {
    const member = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      )
    });

    return member || null;
  }

  /**
   * Check if user has permission for action
   */
  async hasPermission(teamId: number, userId: string, action: string): Promise<boolean> {
    const member = await this.getTeamMember(teamId, userId);
    if (!member || member.status !== 'active') {
      return false;
    }

    const permissions = {
      'view_repositories': ['owner', 'admin', 'security_admin', 'developer', 'viewer'],
      'manage_repositories': ['owner', 'admin', 'developer'],
      'manage_security': ['owner', 'admin', 'security_admin'],
      'manage_team': ['owner', 'admin'],
      'assign_alerts': ['owner', 'admin', 'security_admin', 'developer'],
      'view_alerts': ['owner', 'admin', 'security_admin', 'developer', 'viewer']
    };

    const allowedRoles = permissions[action as keyof typeof permissions] || [];
    return allowedRoles.includes(member.role);
  }

  /**
   * Invite user to team
   */
  async inviteToTeam(teamId: number, inviterId: string, inviteData: {
    email: string;
    role: string;
  }): Promise<void> {
    // Check if inviter has permission
    if (!await this.hasPermission(teamId, inviterId, 'manage_team')) {
      throw new Error('Permission denied');
    }

    // Check if user is already a member
    const existingInvite = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, inviteData.email) // Using email as user identifier for now
      )
    });

    if (existingInvite) {
      throw new Error('User is already a team member or has a pending invitation');
    }

    // Create pending team member entry
    await db.insert(teamMembers).values({
      teamId,
      userId: inviteData.email,
      role: inviteData.role,
      status: 'pending',
      invitedBy: inviterId,
      invitedAt: new Date()
    });

    // Send invitation email
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    if (team) {
      await emailService.sendTeamInvitation(
        inviteData.email,
        team.name,
        inviteData.role,
        `${process.env.FRONTEND_URL || 'http://localhost:5000'}/teams/accept-invitation`
      );
    }

    // Create notification
    await this.createTeamNotification(teamId, {
      type: 'member_invited',
      title: 'New Team Member Invited',
      message: `${inviteData.email} has been invited to join the team as ${inviteData.role}`,
      severity: 'info',
      recipients: ['admin', 'owner'],
      channels: ['in_app']
    });
  }

  /**
   * Update team member role
   */
  async updateMemberRole(memberId: number, newRole: string, updaterId: string): Promise<void> {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
      with: {
        team: true
      }
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Check if updater has permission
    if (!await this.hasPermission(member.teamId, updaterId, 'manage_team')) {
      throw new Error('Permission denied');
    }

    // Cannot change owner role
    if (member.role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    await db.update(teamMembers)
      .set({ 
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(teamMembers.id, memberId));

    // Create notification
    await this.createTeamNotification(member.teamId, {
      type: 'role_updated',
      title: 'Member Role Updated',
      message: `Team member role has been updated to ${newRole}`,
      severity: 'info',
      recipients: [member.userId],
      channels: ['in_app', 'email']
    });
  }

  /**
   * Remove team member
   */
  async removeMember(memberId: number, removerId: string): Promise<void> {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId)
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Check if remover has permission
    if (!await this.hasPermission(member.teamId, removerId, 'manage_team')) {
      throw new Error('Permission denied');
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      throw new Error('Cannot remove team owner');
    }

    await db.delete(teamMembers)
      .where(eq(teamMembers.id, memberId));

    // Create notification
    await this.createTeamNotification(member.teamId, {
      type: 'member_removed',
      title: 'Team Member Removed',
      message: `A team member has been removed from the team`,
      severity: 'warning',
      recipients: ['admin', 'owner'],
      channels: ['in_app']
    });
  }

  /**
   * Add repository to team
   */
  async addRepositoryToTeam(teamId: number, repositoryId: number, adderId: string): Promise<void> {
    // Check if adder has permission
    if (!await this.hasPermission(teamId, adderId, 'manage_repositories')) {
      throw new Error('Permission denied');
    }

    // Check if repository is already added
    const existing = await db.query.teamRepositories.findFirst({
      where: and(
        eq(teamRepositories.teamId, teamId),
        eq(teamRepositories.repositoryId, repositoryId)
      )
    });

    if (existing) {
      throw new Error('Repository is already added to this team');
    }

    await db.insert(teamRepositories).values({
      teamId,
      repositoryId,
      addedBy: adderId
    });
  }

  /**
   * Assign alert to team member
   */
  async assignAlert(alertId: number, assigneeId: string, assignerId: string, teamId: number, options: {
    priority?: string;
    dueDate?: Date;
    notes?: string;
  } = {}): Promise<void> {
    // Check if assigner has permission
    if (!await this.hasPermission(teamId, assignerId, 'assign_alerts')) {
      throw new Error('Permission denied');
    }

    // Check if assignee is team member
    const assignee = await this.getTeamMember(teamId, assigneeId);
    if (!assignee) {
      throw new Error('Assignee is not a team member');
    }

    await db.insert(alertAssignments).values({
      alertId,
      assignedTo: assigneeId,
      assignedBy: assignerId,
      teamId,
      priority: options.priority || 'medium',
      dueDate: options.dueDate,
      notes: options.notes
    });

    // Create notification
    await this.createTeamNotification(teamId, {
      type: 'alert_assigned',
      title: 'Alert Assigned',
      message: `An alert has been assigned to a team member`,
      severity: 'info',
      recipients: [assigneeId],
      channels: ['in_app', 'email']
    });
  }

  /**
   * Create team notification
   */
  async createTeamNotification(teamId: number, notificationData: Omit<InsertTeamNotification, 'teamId'>): Promise<void> {
    await db.insert(teamNotifications).values({
      teamId,
      ...notificationData
    });
  }

  /**
   * Get team notifications
   */
  async getTeamNotifications(teamId: number, userId: string, limit: number = 50): Promise<any[]> {
    // Check if user has access to team
    const member = await this.getTeamMember(teamId, userId);
    if (!member) {
      throw new Error('Access denied');
    }

    return await db.query.teamNotifications.findMany({
      where: eq(teamNotifications.teamId, teamId),
      orderBy: [desc(teamNotifications.createdAt)],
      limit
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number, userId: string): Promise<void> {
    const notification = await db.query.teamNotifications.findFirst({
      where: eq(teamNotifications.id, notificationId)
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Check if user has access to this team
    const member = await this.getTeamMember(notification.teamId, userId);
    if (!member) {
      throw new Error('Access denied');
    }

    const readBy = notification.readBy as string[] || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      
      await db.update(teamNotifications)
        .set({ readBy })
        .where(eq(teamNotifications.id, notificationId));
    }
  }

  /**
   * Get team repositories
   */
  async getTeamRepositories(teamId: number, userId: string): Promise<any[]> {
    // Check if user has access to team
    if (!await this.hasPermission(teamId, userId, 'view_repositories')) {
      throw new Error('Access denied');
    }

    return await db.query.teamRepositories.findMany({
      where: eq(teamRepositories.teamId, teamId),
      with: {
        repository: true
      },
      orderBy: [desc(teamRepositories.addedAt)]
    });
  }
}

export const teamService = new TeamService();