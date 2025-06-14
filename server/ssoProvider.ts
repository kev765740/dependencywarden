import * as openidClient from 'openid-client';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SSOConfig {
  provider: 'AZURE_AD' | 'OKTA' | 'GOOGLE' | 'SAML' | 'OIDC';
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  redirectUri: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
}

interface SSOUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  groups: string[];
  roles: string[];
  department?: string;
  organization?: string;
  claims: Record<string, any>;
}

interface SSOSession {
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  provider: string;
  claims: Record<string, any>;
}

export class SSOProvider {
  private clients: Map<string, any> = new Map();
  private configs: Map<string, SSOConfig> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize SSO providers from environment variables
   */
  private async initializeProviders() {
    // Azure AD / Microsoft Entra ID
    if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
      const azureConfig: SSOConfig = {
        provider: 'AZURE_AD',
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        issuerUrl: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/v2.0`,
        redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/azure/callback`,
        scopes: ['openid', 'profile', 'email', 'User.Read']
      };
      
      this.configs.set('azure', azureConfig);
      await this.initializeClient('azure', azureConfig);
    }

    // Okta
    if (process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET) {
      const oktaConfig: SSOConfig = {
        provider: 'OKTA',
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET,
        issuerUrl: process.env.OKTA_ISSUER_URL || `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
        redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/okta/callback`,
        scopes: ['openid', 'profile', 'email', 'groups']
      };
      
      this.configs.set('okta', oktaConfig);
      await this.initializeClient('okta', oktaConfig);
    }

    // Google Workspace
    if (process.env.GOOGLE_SSO_CLIENT_ID && process.env.GOOGLE_SSO_CLIENT_SECRET) {
      const googleConfig: SSOConfig = {
        provider: 'GOOGLE',
        clientId: process.env.GOOGLE_SSO_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SSO_CLIENT_SECRET,
        issuerUrl: 'https://accounts.google.com',
        redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`,
        scopes: ['openid', 'profile', 'email']
      };
      
      this.configs.set('google', googleConfig);
      await this.initializeClient('google', googleConfig);
    }

    // Generic OIDC
    if (process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_ISSUER_URL) {
      const oidcConfig: SSOConfig = {
        provider: 'OIDC',
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        issuerUrl: process.env.OIDC_ISSUER_URL,
        redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/oidc/callback`,
        scopes: (process.env.OIDC_SCOPES || 'openid profile email').split(' ')
      };
      
      this.configs.set('oidc', oidcConfig);
      await this.initializeClient('oidc', oidcConfig);
    }
  }

  /**
   * Initialize OIDC client for a provider
   */
  private async initializeClient(providerId: string, config: SSOConfig) {
    try {
      const issuer = await (openidClient as any).Issuer.discover(config.issuerUrl);
      
      const client = new issuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uris: [config.redirectUri],
        response_types: ['code']
      });

      this.clients.set(providerId, client);
      console.log(`SSO provider ${providerId} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize SSO provider ${providerId}:`, error);
    }
  }

  /**
   * Get authorization URL for SSO login
   */
  getAuthorizationUrl(providerId: string, state?: string): string {
    const client = this.clients.get(providerId);
    const config = this.configs.get(providerId);
    
    if (!client || !config) {
      throw new Error(`SSO provider ${providerId} not configured`);
    }

    const authParams: Record<string, string> = {
      scope: config.scopes.join(' '),
      ...(state && { state }),
      ...(config.additionalParams || {})
    };

    // Provider-specific parameters
    if (config.provider === 'AZURE_AD') {
      authParams.prompt = 'select_account';
    } else if (config.provider === 'OKTA') {
      authParams.prompt = 'login';
    }

    return client.authorizationUrl(authParams);
  }

  /**
   * Handle SSO callback and exchange code for tokens
   */
  async handleCallback(
    providerId: string, 
    code: string, 
    state?: string
  ): Promise<{ user: SSOUser; session: SSOSession }> {
    const client = this.clients.get(providerId);
    const config = this.configs.get(providerId);
    
    if (!client || !config) {
      throw new Error(`SSO provider ${providerId} not configured`);
    }

    try {
      // Exchange authorization code for tokens
      const tokenSet = await client.callback(config.redirectUri, { code, state });
      
      // Get user information
      const userinfo = await client.userinfo(tokenSet.access_token!);
      
      // Map provider response to our user format
      const ssoUser = this.mapUserInfo(providerId, userinfo, tokenSet);
      
      // Create or update user in database
      const dbUser = await this.createOrUpdateUser(ssoUser);
      
      // Create session
      const session = this.createSession(String(dbUser.id), providerId, tokenSet, userinfo);
      
      return { user: ssoUser, session };
    } catch (error) {
      console.error(`SSO callback error for ${providerId}:`, error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map provider userinfo to our user format
   */
  private mapUserInfo(providerId: string, userinfo: any, tokenSet: any): SSOUser {
    const config = this.configs.get(providerId);
    let mappedUser: SSOUser;

    switch (config?.provider) {
      case 'AZURE_AD':
        mappedUser = {
          id: userinfo.sub || userinfo.oid as string,
          email: userinfo.email || userinfo.preferred_username as string,
          firstName: userinfo.given_name as string || '',
          lastName: userinfo.family_name as string || '',
          groups: userinfo.groups as string[] || [],
          roles: userinfo.roles as string[] || [],
          department: userinfo.department as string,
          organization: userinfo.companyName as string,
          claims: {
            ...userinfo,
            tenant_id: userinfo.tid,
            object_id: userinfo.oid
          }
        };
        break;

      case 'OKTA':
        mappedUser = {
          id: userinfo.sub as string,
          email: userinfo.email as string,
          firstName: userinfo.given_name as string || '',
          lastName: userinfo.family_name as string || '',
          groups: userinfo.groups as string[] || [],
          roles: userinfo.roles as string[] || [],
          department: userinfo.department as string,
          organization: userinfo.organization as string,
          claims: userinfo
        };
        break;

      case 'GOOGLE':
        mappedUser = {
          id: userinfo.sub as string,
          email: userinfo.email as string,
          firstName: userinfo.given_name as string || '',
          lastName: userinfo.family_name as string || '',
          groups: [],
          roles: [],
          organization: userinfo.hd as string, // Google Workspace domain
          claims: userinfo
        };
        break;

      default:
        // Generic OIDC mapping
        mappedUser = {
          id: userinfo.sub as string,
          email: userinfo.email as string,
          firstName: userinfo.given_name as string || userinfo.name as string || '',
          lastName: userinfo.family_name as string || '',
          groups: userinfo.groups as string[] || [],
          roles: userinfo.roles as string[] || [],
          claims: userinfo
        };
    }

    return mappedUser;
  }

  /**
   * Create or update user in database
   */
  private async createOrUpdateUser(ssoUser: SSOUser) {
    try {
      // Check if user exists
      const existingUsers = await db.select()
        .from(users)
        .where(eq(users.email, ssoUser.email))
        .limit(1);

      if (existingUsers.length > 0) {
        // Update existing user
        const updatedUser = await db.update(users)
          .set({
            firstName: ssoUser.firstName,
            lastName: ssoUser.lastName,
            ssoId: ssoUser.id,
            claims: ssoUser.claims,
            updatedAt: new Date()
          })
          .where(eq(users.id, existingUsers[0].id))
          .returning();

        return updatedUser[0];
      } else {
        // Create new user
        const newUser = await db.insert(users)
          .values([{
            email: ssoUser.email,
            password: '', // SSO users don't need password
            firstName: ssoUser.firstName,
            lastName: ssoUser.lastName,
            ssoId: ssoUser.id,
            claims: ssoUser.claims,
            emailVerified: true, // SSO users are pre-verified
            createdAt: new Date(),
            updatedAt: new Date()
          }])
          .returning();

        return newUser[0];
      }
    } catch (error) {
      console.error('Error creating/updating SSO user:', error);
      throw error;
    }
  }

  /**
   * Create SSO session
   */
  private createSession(userId: string, providerId: string, tokenSet: any, userinfo: any): SSOSession {
    const sessionId = `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + (tokenSet.expires_in || 3600) * 1000);

    const session: SSOSession = {
      userId,
      sessionId,
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token,
      expiresAt,
      provider: providerId,
      claims: userinfo
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Refresh SSO token
   */
  async refreshToken(sessionId: string): Promise<SSOSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.refreshToken) {
      return null;
    }

    const client = this.clients.get(session.provider);
    if (!client) {
      return null;
    }

    try {
      const tokenSet = await client.refresh(session.refreshToken);
      
      // Update session with new tokens
      const updatedSession: SSOSession = {
        ...session,
        accessToken: tokenSet.access_token!,
        refreshToken: tokenSet.refresh_token || session.refreshToken,
        expiresAt: new Date(Date.now() + (tokenSet.expires_in || 3600) * 1000)
      };

      this.activeSessions.set(sessionId, updatedSession);
      return updatedSession;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.activeSessions.delete(sessionId);
      return null;
    }
  }

  /**
   * Logout user from SSO
   */
  async logout(sessionId: string): Promise<string | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const client = this.clients.get(session.provider);
    const config = this.configs.get(session.provider);
    
    // Remove session
    this.activeSessions.delete(sessionId);

    // Get logout URL if supported
    if (client && client.issuer.metadata.end_session_endpoint) {
      const logoutUrl = client.endSessionUrl({
        post_logout_redirect_uri: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/logout-complete`
      });
      return logoutUrl;
    }

    return null;
  }

  /**
   * Validate SSO session
   */
  validateSession(sessionId: string): SSOSession | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Get user groups and roles for authorization
   */
  getUserPermissions(sessionId: string): { groups: string[]; roles: string[]; claims: Record<string, any> } | null {
    const session = this.validateSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      groups: session.claims.groups || [],
      roles: session.claims.roles || [],
      claims: session.claims
    };
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(sessionId: string, requiredGroups?: string[], requiredRoles?: string[]): boolean {
    const permissions = this.getUserPermissions(sessionId);
    if (!permissions) {
      return false;
    }

    // Check groups
    if (requiredGroups && requiredGroups.length > 0) {
      const hasRequiredGroup = requiredGroups.some(group => permissions.groups.includes(group));
      if (!hasRequiredGroup) {
        return false;
      }
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => permissions.roles.includes(role));
      if (!hasRequiredRole) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get available SSO providers
   */
  getAvailableProviders(): Array<{ id: string; name: string; provider: string }> {
    return Array.from(this.configs.entries()).map(([id, config]) => ({
      id,
      name: this.getProviderDisplayName(config.provider),
      provider: config.provider
    }));
  }

  /**
   * Get provider display name
   */
  private getProviderDisplayName(provider: string): string {
    switch (provider) {
      case 'AZURE_AD': return 'Microsoft Azure AD';
      case 'OKTA': return 'Okta';
      case 'GOOGLE': return 'Google Workspace';
      case 'SAML': return 'SAML 2.0';
      case 'OIDC': return 'OpenID Connect';
      default: return provider;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalActiveSessions: number;
    sessionsByProvider: Record<string, number>;
    expiringIn1Hour: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    const sessionsByProvider: Record<string, number> = {};
    let expiringIn1Hour = 0;

    sessions.forEach(session => {
      sessionsByProvider[session.provider] = (sessionsByProvider[session.provider] || 0) + 1;
      
      if (session.expiresAt <= oneHourFromNow) {
        expiringIn1Hour++;
      }
    });

    return {
      totalActiveSessions: sessions.length,
      sessionsByProvider,
      expiringIn1Hour
    };
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of Array.from(this.activeSessions.entries())) {
      if (session.expiresAt <= now) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

export const ssoProvider = new SSOProvider();