import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ConnectedUser {
  id: string;
  userId: string;
  username: string;
  lastActivity: Date;
  currentRoom: string | null;
}

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  timestamp: Date;
  room: string;
  metadata?: any;
}

export class CollaborationService {
  private wss: WebSocketServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private activeRooms: Map<string, Set<string>> = new Map();
  private activityLog: ActivityLog[] = [];
  private maxActivityLogSize = 1000;

  /**
   * Initialize WebSocket server for real-time collaboration
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/collaboration' 
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const userId = this.extractUserIdFromRequest(request);
      const connectionId = this.generateConnectionId();
      
      // Register user connection
      this.connectedUsers.set(connectionId, {
        id: connectionId,
        userId: userId || 'anonymous',
        username: `User-${userId?.slice(0, 8) || 'anon'}`,
        lastActivity: new Date(),
        currentRoom: null
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(connectionId);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        connectionId,
        timestamp: new Date().toISOString()
      }));
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(connectionId: string, message: any): void {
    const user = this.connectedUsers.get(connectionId);
    if (!user) return;

    user.lastActivity = new Date();

    switch (message.type) {
      case 'join_room':
        this.joinRoom(connectionId, message.room);
        break;
      case 'leave_room':
        this.leaveRoom(connectionId, message.room);
        break;
      case 'user_activity':
        this.logActivity(user, message.action, message.room, message.metadata);
        break;
      case 'broadcast_to_room':
        this.broadcastToRoom(message.room, message.data, connectionId);
        break;
    }
  }

  /**
   * Join a collaboration room
   */
  private joinRoom(connectionId: string, room: string): void {
    const user = this.connectedUsers.get(connectionId);
    if (!user) return;

    // Leave current room if any
    if (user.currentRoom) {
      this.leaveRoom(connectionId, user.currentRoom);
    }

    // Join new room
    user.currentRoom = room;
    
    if (!this.activeRooms.has(room)) {
      this.activeRooms.set(room, new Set());
    }
    this.activeRooms.get(room)!.add(connectionId);

    this.logActivity(user, 'joined_room', room);
    this.broadcastToRoom(room, {
      type: 'user_joined',
      user: { id: user.userId, username: user.username }
    }, connectionId);
  }

  /**
   * Leave a collaboration room
   */
  private leaveRoom(connectionId: string, room: string): void {
    const user = this.connectedUsers.get(connectionId);
    if (!user) return;

    const roomUsers = this.activeRooms.get(room);
    if (roomUsers) {
      roomUsers.delete(connectionId);
      if (roomUsers.size === 0) {
        this.activeRooms.delete(room);
      }
    }

    if (user.currentRoom === room) {
      user.currentRoom = null;
    }

    this.logActivity(user, 'left_room', room);
    this.broadcastToRoom(room, {
      type: 'user_left',
      user: { id: user.userId, username: user.username }
    }, connectionId);
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(connectionId: string): void {
    const user = this.connectedUsers.get(connectionId);
    if (!user) return;

    // Leave current room
    if (user.currentRoom) {
      this.leaveRoom(connectionId, user.currentRoom);
    }

    // Remove from connected users
    this.connectedUsers.delete(connectionId);
  }

  /**
   * Log user activity
   */
  private logActivity(user: ConnectedUser, action: string, room: string, metadata?: any): void {
    const activity: ActivityLog = {
      id: this.generateActivityId(),
      userId: user.userId,
      username: user.username,
      action,
      timestamp: new Date(),
      room,
      metadata
    };

    this.activityLog.unshift(activity);
    
    // Maintain log size limit
    if (this.activityLog.length > this.maxActivityLogSize) {
      this.activityLog = this.activityLog.slice(0, this.maxActivityLogSize);
    }
  }

  /**
   * Broadcast message to all users in a room
   */
  private broadcastToRoom(room: string, data: any, excludeConnectionId?: string): void {
    const roomUsers = this.activeRooms.get(room);
    if (!roomUsers || !this.wss) return;

    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      room
    });

    roomUsers.forEach(connectionId => {
      if (connectionId === excludeConnectionId) return;
      
      // Note: In a real implementation, you'd maintain WebSocket connections
      // This is a simplified version for the collaboration stats
    });
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get count of active rooms
   */
  getActiveRoomsCount(): number {
    return this.activeRooms.size;
  }

  /**
   * Get total activity count
   */
  getTotalActivityCount(): number {
    return this.activityLog.length;
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit: number = 10): ActivityLog[] {
    return this.activityLog.slice(0, limit);
  }

  /**
   * Get collaboration statistics
   */
  getCollaborationStats(): {
    connectedUsers: number;
    activeRooms: number;
    totalActivity: number;
    recentActivity: ActivityLog[];
    roomDetails: Array<{
      room: string;
      userCount: number;
      lastActivity: Date | null;
    }>;
  } {
    const roomDetails = Array.from(this.activeRooms.entries()).map(([room, users]) => ({
      room,
      userCount: users.size,
      lastActivity: this.getLastActivityForRoom(room)
    }));

    return {
      connectedUsers: this.getConnectedUsersCount(),
      activeRooms: this.getActiveRoomsCount(),
      totalActivity: this.getTotalActivityCount(),
      recentActivity: this.getRecentActivity(10),
      roomDetails
    };
  }

  /**
   * Get last activity for a specific room
   */
  private getLastActivityForRoom(room: string): Date | null {
    const roomActivity = this.activityLog.find(activity => activity.room === room);
    return roomActivity ? roomActivity.timestamp : null;
  }

  /**
   * Extract user ID from WebSocket request
   */
  private extractUserIdFromRequest(request: any): string | null {
    // In a real implementation, extract from auth token or session
    // Return actual collaboration data from database
    return request.headers['x-user-id'] || null;
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique activity ID
   */
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [connectionId, user] of Array.from(this.connectedUsers.entries())) {
      if (now.getTime() - user.lastActivity.getTime() > inactiveThreshold) {
        this.handleDisconnection(connectionId);
      }
    }
  }
}

export const collaboration = new CollaborationService();