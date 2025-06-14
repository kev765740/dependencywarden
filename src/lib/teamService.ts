import { useAsyncData } from '@/hooks/use-async-data';

export enum Role {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum Permission {
  VIEW_DEPENDENCIES = 'view_dependencies',
  MANAGE_DEPENDENCIES = 'manage_dependencies',
  VIEW_SECURITY = 'view_security',
  MANAGE_SECURITY = 'manage_security',
  VIEW_LICENSES = 'view_licenses',
  MANAGE_LICENSES = 'manage_licenses',
  MANAGE_TEAM = 'manage_team',
  MANAGE_BILLING = 'manage_billing',
  MANAGE_SETTINGS = 'manage_settings'
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  avatar_url: string;
  last_active: string;
  joined_at: string;
  repositories: string[];
}

interface Activity {
  id: string;
  type: 'dependency_update' | 'security_alert' | 'license_violation' | 'team_change' | 'settings_change';
  actor: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  target: {
    type: string;
    id: string;
    name: string;
  };
  metadata: Record<string, any>;
  timestamp: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  target: {
    type: string;
    id: string;
  };
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

interface Notification {
  id: string;
  type: 'alert' | 'mention' | 'update' | 'system';
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

class TeamService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.dependencywarden.com';

  // Role permissions mapping
  private readonly rolePermissions: Record<Role, Permission[]> = {
    [Role.VIEWER]: [
      Permission.VIEW_DEPENDENCIES,
      Permission.VIEW_SECURITY,
      Permission.VIEW_LICENSES
    ],
    [Role.EDITOR]: [
      Permission.VIEW_DEPENDENCIES,
      Permission.MANAGE_DEPENDENCIES,
      Permission.VIEW_SECURITY,
      Permission.MANAGE_SECURITY,
      Permission.VIEW_LICENSES,
      Permission.MANAGE_LICENSES
    ],
    [Role.ADMIN]: [
      Permission.VIEW_DEPENDENCIES,
      Permission.MANAGE_DEPENDENCIES,
      Permission.VIEW_SECURITY,
      Permission.MANAGE_SECURITY,
      Permission.VIEW_LICENSES,
      Permission.MANAGE_LICENSES,
      Permission.MANAGE_TEAM,
      Permission.MANAGE_SETTINGS
    ],
    [Role.OWNER]: [
      Permission.VIEW_DEPENDENCIES,
      Permission.MANAGE_DEPENDENCIES,
      Permission.VIEW_SECURITY,
      Permission.MANAGE_SECURITY,
      Permission.VIEW_LICENSES,
      Permission.MANAGE_LICENSES,
      Permission.MANAGE_TEAM,
      Permission.MANAGE_BILLING,
      Permission.MANAGE_SETTINGS
    ]
  };

  async getTeamMembers(): Promise<TeamMember[]> {
    // TODO: Implement actual API call
    return [];
  }

  async inviteTeamMember(email: string, role: Role): Promise<TeamMember> {
    // TODO: Implement actual API call
    return {
      id: `member-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role,
      permissions: this.rolePermissions[role],
      avatar_url: '',
      last_active: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      repositories: []
    };
  }

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    // TODO: Implement actual API call
    return {} as TeamMember;
  }

  async removeTeamMember(memberId: string): Promise<void> {
    // TODO: Implement actual API call
  }

  async getTeamActivity(page: number = 1, limit: number = 20): Promise<Activity[]> {
    // TODO: Implement actual API call
    return [];
  }

  async addComment(
    content: string,
    targetType: string,
    targetId: string
  ): Promise<Comment> {
    // TODO: Implement actual API call
    return {
      id: `comment-${Date.now()}`,
      content,
      author: {
        id: 'current-user',
        name: 'Current User',
        email: 'user@example.com',
        avatar_url: ''
      },
      target: {
        type: targetType,
        id: targetId
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      replies: []
    };
  }

  async getComments(targetType: string, targetId: string): Promise<Comment[]> {
    // TODO: Implement actual API call
    return [];
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    // TODO: Implement actual API call
    return {} as Comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    // TODO: Implement actual API call
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    // TODO: Implement actual API call
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // TODO: Implement actual API call
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    // TODO: Implement actual API call
  }

  hasPermission(userRole: Role, permission: Permission): boolean {
    return this.rolePermissions[userRole].includes(permission);
  }

  // React hooks
  useTeamMembers() {
    return useAsyncData(
      () => this.getTeamMembers(),
      [],
      {
        cacheKey: 'team-members',
        cacheTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  useTeamActivity(page: number = 1, limit: number = 20) {
    return useAsyncData(
      () => this.getTeamActivity(page, limit),
      [page, limit],
      {
        cacheKey: `team-activity-${page}-${limit}`,
        cacheTime: 1 * 60 * 1000, // 1 minute
      }
    );
  }

  useComments(targetType: string, targetId: string) {
    return useAsyncData(
      () => this.getComments(targetType, targetId),
      [targetType, targetId],
      {
        cacheKey: `comments-${targetType}-${targetId}`,
        cacheTime: 1 * 60 * 1000, // 1 minute
      }
    );
  }

  useNotifications(userId: string) {
    return useAsyncData(
      () => this.getNotifications(userId),
      [userId],
      {
        cacheKey: `notifications-${userId}`,
        cacheTime: 30 * 1000, // 30 seconds
      }
    );
  }
}

export const teamService = new TeamService(); 