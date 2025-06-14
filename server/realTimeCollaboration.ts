import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface CollaborationEvent {
  type: 'alert_updated' | 'repository_scanned' | 'user_joined' | 'user_left' | 'comment_added' | 'status_changed';
  payload: any;
  userId: string;
  timestamp: Date;
  targetUsers?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ConnectedUser {
  socket: WebSocket;
  userId: string;
  permissions: string[];
  lastActivity: Date;
  subscriptions: Set<string>;
}

interface TeamActivity {
  id: string;
  type: string;
  userId: string;
  userName: string;
  description: string;
  timestamp: Date;
  metadata: any;
}

export class RealTimeCollaboration {
  private wss: WebSocketServer;
  private connectedUsers = new Map<string, ConnectedUser>();
  private activityHistory: TeamActivity[] = [];
  private rooms = new Map<string, Set<string>>(); // roomId -> userIds

  constructor(server: any) {
    try {
      this.wss = new WebSocketServer({ 
        server, 
        path: '/ws',
        verifyClient: this.verifyClient.bind(this)
      });
      
      this.wss.on('connection', this.handleConnection.bind(this));
      this.wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });
      this.startHeartbeat();
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      // Continue without WebSocket functionality
    }
  }

  /**
   * Verify WebSocket client authentication
   */
  private verifyClient(info: { req: IncomingMessage }): boolean {
    // Extract token from query params or headers
    const url = new URL(info.req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    
    // In production, verify JWT token here
    return !!token;
  }

  /**
   * Handle new WebSocket connections
   */
  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const url = new URL(request.url || '', 'http://localhost');
    const userId = url.searchParams.get('userId') || 'anonymous';
    const permissions = (url.searchParams.get('permissions') || '').split(',');

    const user: ConnectedUser = {
      socket,
      userId,
      permissions,
      lastActivity: new Date(),
      subscriptions: new Set()
    };

    this.connectedUsers.set(userId, user);

    // Send welcome message with current state
    this.sendToUser(userId, {
      type: 'connection_established',
      payload: {
        connectedUsers: Array.from(this.connectedUsers.keys()),
        recentActivity: this.activityHistory.slice(-20)
      }
    });

    // Broadcast user joined event
    this.broadcastEvent({
      type: 'user_joined',
      payload: { userId, timestamp: new Date() },
      userId,
      timestamp: new Date()
    }, [userId]);

    // Set up message handlers
    socket.on('message', (data) => this.handleMessage(userId, data));
    socket.on('close', () => this.handleDisconnection(userId));
    socket.on('error', (error) => this.handleError(userId, error));

    // Update last activity
    socket.on('pong', () => {
      if (this.connectedUsers.has(userId)) {
        this.connectedUsers.get(userId)!.lastActivity = new Date();
      }
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(userId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe_to_repository':
          this.subscribeToRepository(userId, message.repositoryId);
          break;
          
        case 'subscribe_to_alerts':
          this.subscribeToAlerts(userId, message.severity);
          break;
          
        case 'join_room':
          this.joinRoom(userId, message.roomId);
          break;
          
        case 'leave_room':
          this.leaveRoom(userId, message.roomId);
          break;
          
        case 'send_message':
          this.handleChatMessage(userId, message);
          break;
          
        case 'update_status':
          this.updateUserStatus(userId, message.status);
          break;
          
        case 'request_screen_share':
          this.handleScreenShareRequest(userId, message);
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(userId: string): void {
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.delete(userId);
      
      // Remove from all rooms
      this.rooms.forEach((users, roomId) => {
        users.delete(userId);
        if (users.size === 0) {
          this.rooms.delete(roomId);
        }
      });

      // Broadcast user left event
      this.broadcastEvent({
        type: 'user_left',
        payload: { userId, timestamp: new Date() },
        userId,
        timestamp: new Date()
      });

      this.logActivity({
        id: this.generateId(),
        type: 'user_disconnected',
        userId,
        userName: userId,
        description: 'User disconnected from collaboration session',
        timestamp: new Date(),
        metadata: {}
      });
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(userId: string, error: Error): void {
    console.error(`WebSocket error for user ${userId}:`, error);
  }

  /**
   * Subscribe user to repository updates
   */
  private subscribeToRepository(userId: string, repositoryId: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.subscriptions.add(`repository:${repositoryId}`);
      this.sendToUser(userId, {
        type: 'subscription_confirmed',
        payload: { type: 'repository', id: repositoryId }
      });
    }
  }

  /**
   * Subscribe user to security alerts
   */
  private subscribeToAlerts(userId: string, severity?: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      const subscription = severity ? `alerts:${severity}` : 'alerts:all';
      user.subscriptions.add(subscription);
      this.sendToUser(userId, {
        type: 'subscription_confirmed',
        payload: { type: 'alerts', severity: severity || 'all' }
      });
    }
  }

  /**
   * Join collaboration room
   */
  private joinRoom(userId: string, roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId)!.add(userId);
    
    // Notify other users in the room
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      payload: { userId, roomId, timestamp: new Date() },
      userId,
      timestamp: new Date()
    }, [userId]);

    this.sendToUser(userId, {
      type: 'room_joined',
      payload: { 
        roomId, 
        participants: Array.from(this.rooms.get(roomId) || [])
      }
    });
  }

  /**
   * Leave collaboration room
   */
  private leaveRoom(userId: string, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      
      if (room.size === 0) {
        this.rooms.delete(roomId);
      } else {
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          payload: { userId, roomId, timestamp: new Date() },
          userId,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle chat messages in rooms
   */
  private handleChatMessage(userId: string, message: any): void {
    const { roomId, content, type = 'text' } = message;
    
    const chatMessage: CollaborationEvent = {
      type: 'comment_added',
      payload: {
        userId,
        roomId,
        content,
        messageType: type,
        timestamp: new Date()
      },
      userId,
      timestamp: new Date()
    };

    this.broadcastToRoom(roomId, chatMessage, [userId]);
    
    this.logActivity({
      id: this.generateId(),
      type: 'chat_message',
      userId,
      userName: userId,
      description: `Sent message in ${roomId}`,
      timestamp: new Date(),
      metadata: { roomId, messageType: type }
    });
  }

  /**
   * Update user status
   */
  private updateUserStatus(userId: string, status: string): void {
    this.broadcastEvent({
      type: 'status_changed',
      payload: { userId, status, timestamp: new Date() },
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Handle screen sharing requests
   */
  private handleScreenShareRequest(userId: string, message: any): void {
    const { targetUserId, roomId } = message;
    
    if (targetUserId) {
      this.sendToUser(targetUserId, {
        type: 'screen_share_request',
        payload: {
          fromUserId: userId,
          roomId,
          timestamp: new Date()
        }
      });
    }
  }

  /**
   * Broadcast security alert updates
   */
  broadcastSecurityAlert(alert: any): void {
    const event: CollaborationEvent = {
      type: 'alert_updated',
      payload: {
        alert,
        action: 'created',
        timestamp: new Date()
      },
      userId: 'system',
      timestamp: new Date(),
      priority: alert.severity
    };

    // Send to users subscribed to alerts
    this.connectedUsers.forEach((user, userId) => {
      const hasAlertSubscription = 
        user.subscriptions.has('alerts:all') ||
        user.subscriptions.has(`alerts:${alert.severity}`) ||
        user.subscriptions.has(`repository:${alert.repositoryId}`);
        
      if (hasAlertSubscription) {
        this.sendToUser(userId, event);
      }
    });

    this.logActivity({
      id: this.generateId(),
      type: 'security_alert',
      userId: 'system',
      userName: 'Security System',
      description: `New ${alert.severity} security alert: ${alert.title}`,
      timestamp: new Date(),
      metadata: { alertId: alert.id, severity: alert.severity }
    });
  }

  /**
   * Broadcast repository scan updates
   */
  broadcastRepositoryScan(repositoryId: number, status: string, results?: any): void {
    const event: CollaborationEvent = {
      type: 'repository_scanned',
      payload: {
        repositoryId,
        status,
        results,
        timestamp: new Date()
      },
      userId: 'system',
      timestamp: new Date()
    };

    // Send to users subscribed to this repository
    this.connectedUsers.forEach((user, userId) => {
      if (user.subscriptions.has(`repository:${repositoryId}`)) {
        this.sendToUser(userId, event);
      }
    });
  }

  /**
   * Broadcast comment additions
   */
  broadcastComment(comment: any): void {
    const event: CollaborationEvent = {
      type: 'comment_added',
      payload: {
        comment,
        timestamp: new Date()
      },
      userId: comment.userId,
      timestamp: new Date()
    };

    this.broadcastEvent(event);
  }

  /**
   * Send message to specific user
   */
  private sendToUser(userId: string, event: any): void {
    const user = this.connectedUsers.get(userId);
    if (user && user.socket.readyState === WebSocket.OPEN) {
      try {
        user.socket.send(JSON.stringify(event));
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
      }
    }
  }

  /**
   * Broadcast event to all connected users
   */
  private broadcastEvent(event: CollaborationEvent, excludeUsers: string[] = []): void {
    this.connectedUsers.forEach((user, userId) => {
      if (!excludeUsers.includes(userId)) {
        this.sendToUser(userId, event);
      }
    });
  }

  /**
   * Broadcast message to room participants
   */
  private broadcastToRoom(roomId: string, event: CollaborationEvent, excludeUsers: string[] = []): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach(userId => {
        if (!excludeUsers.includes(userId)) {
          this.sendToUser(userId, event);
        }
      });
    }
  }

  /**
   * Get current collaboration statistics
   */
  getCollaborationStats(): {
    connectedUsers: number;
    activeRooms: number;
    totalActivity: number;
    recentActivity: TeamActivity[];
  } {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.rooms.size,
      totalActivity: this.activityHistory.length,
      recentActivity: this.activityHistory.slice(-10)
    };
  }

  /**
   * Get active users with their status
   */
  getActiveUsers(): Array<{
    userId: string;
    permissions: string[];
    lastActivity: Date;
    subscriptions: string[];
  }> {
    return Array.from(this.connectedUsers.entries()).map(([userId, user]) => ({
      userId,
      permissions: user.permissions,
      lastActivity: user.lastActivity,
      subscriptions: Array.from(user.subscriptions)
    }));
  }

  /**
   * Force disconnect user
   */
  disconnectUser(userId: string, reason: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.sendToUser(userId, {
        type: 'force_disconnect',
        payload: { reason, timestamp: new Date() }
      });
      
      user.socket.close(1000, reason);
      this.handleDisconnection(userId);
    }
  }

  /**
   * Start heartbeat to detect inactive connections
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      this.connectedUsers.forEach((user, userId) => {
        if (user.socket.readyState === WebSocket.OPEN) {
          if (now.getTime() - user.lastActivity.getTime() > timeout) {
            user.socket.ping();
          }
        } else {
          this.handleDisconnection(userId);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  /**
   * Log team activity
   */
  private logActivity(activity: TeamActivity): void {
    this.activityHistory.push(activity);
    
    // Keep only last 1000 activities
    if (this.activityHistory.length > 1000) {
      this.activityHistory = this.activityHistory.slice(-500);
    }

    // Broadcast activity to connected users
    this.broadcastEvent({
      type: 'user_joined', // Reusing type for activity
      payload: { activity },
      userId: activity.userId,
      timestamp: activity.timestamp
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.connectedUsers.clear();
    this.rooms.clear();
    this.activityHistory = [];
    this.wss.close();
  }
}

export let realTimeCollaboration: RealTimeCollaboration;