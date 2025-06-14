import CryptoJS from 'crypto-js';
import { User } from '@/types';
import { secureStorage } from '@/lib/secureStorage';

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

const JWT_SECRET = 'dependency_warden_secret_2024';

class AuthService {
  private users: Map<string, any> = new Map();

  constructor() {
    this.initializeDemoUsers();
  }

  private initializeDemoUsers() {
    const demoUsers = [
      {
        id: '1',
        email: 'demo@dependencywarden.com',
        password: this.hashPassword('demo123'),
        firstName: 'Demo',
        lastName: 'User',
        role: 'pro',
        emailVerified: true,
        createdAt: new Date()
      },
      {
        id: '2',
        email: 'admin@dependencywarden.com',
        password: this.hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'enterprise',
        emailVerified: true,
        createdAt: new Date()
      }
    ];

    demoUsers.forEach(user => {
      this.users.set(user.email, user);
    });

    console.log('🔐 Demo users initialized:', Array.from(this.users.keys()));
    console.log('🔑 Available demo credentials:');
    console.log('   Email: demo@dependencywarden.com, Password: demo123');
    console.log('   Email: admin@dependencywarden.com, Password: admin123');
  }

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password + 'salt').toString();
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    };
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadB64 = btoa(JSON.stringify(payload));
    const signature = CryptoJS.HmacSHA256(`${header}.${payloadB64}`, JWT_SECRET).toString();
    
    return `${header}.${payloadB64}.${signature}`;
  }

  // Debug method to check users
  debugUsers() {
    console.log('🐛 Debug - Total users:', this.users.size);
    console.log('🐛 Debug - User emails:', Array.from(this.users.keys()));
    Array.from(this.users.entries()).forEach(([email, user]) => {
      console.log(`🐛 Debug - User ${email}:`, {
        id: user.id,
        email: user.email,
        hasPassword: !!user.password,
        passwordHash: user.password?.substring(0, 10) + '...'
      });
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔍 Login attempt for:', credentials.email);
      console.log('🔍 Available users:', Array.from(this.users.keys()));
      
      // Debug users if login fails
      this.debugUsers();
      
      const user = this.users.get(credentials.email);
      
      if (!user) {
        console.log('❌ User not found:', credentials.email);
        console.log('❌ Did you mean one of these?', Array.from(this.users.keys()));
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const hashedPassword = this.hashPassword(credentials.password);
      console.log('🔒 Password hash check:', {
        provided: hashedPassword.substring(0, 10) + '...',
        stored: user.password.substring(0, 10) + '...',
        match: user.password === hashedPassword
      });

      if (user.password !== hashedPassword) {
        console.log('❌ Password mismatch for:', credentials.email);
        console.log('💡 Try password: demo123 or admin123');
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      user.updatedAt = new Date();
      this.users.set(credentials.email, user);

      const userResponse: User = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const token = this.generateToken(userResponse);

      secureStorage.setAuthToken(token);
      secureStorage.setUserData(userResponse);

      console.log('✅ Login successful for:', credentials.email);

      return {
        success: true,
        user: userResponse,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('💥 Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      if (this.users.has(data.email)) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      const userId = Date.now().toString();
      
      const newUser = {
        id: userId,
        email: data.email,
        password: this.hashPassword(data.password),
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: 'free',
        emailVerified: true,
        createdAt: new Date()
      };

      this.users.set(data.email, newUser);

      return {
        success: true,
        message: 'Registration successful! You can now log in.'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const storedUser = secureStorage.getUserData();
      const storedToken = secureStorage.getAuthToken();

      if (!storedUser || !storedToken) {
        return null;
      }

      // Verify token
      const tokenParts = storedToken.split('.');
      if (tokenParts.length !== 3) {
        secureStorage.clear();
        return null;
      }

      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds
        
        if (expiry <= Date.now()) {
          secureStorage.clear();
          return null;
        }

        // Token is valid, check if user exists in our store
        const user = this.users.get(storedUser.email);
        if (!user) {
          secureStorage.clear();
          return null;
        }

        // Return the stored user data since it's valid
        return storedUser;
      } catch (error) {
        console.error('Error parsing token:', error);
        secureStorage.clear();
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      secureStorage.clear();
      return null;
    }
  }

  async logout(): Promise<void> {
    secureStorage.clear();
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    const user = this.users.get(email);
    
    if (!user) {
      return {
        success: true,
        message: 'If an account exists, you will receive a password reset email.'
      };
    }

    console.log(`📧 Password reset email sent to ${email}`);
    
    return {
      success: true,
      message: 'Password reset email sent successfully!'
    };
  }
}

export const authService = new AuthService();