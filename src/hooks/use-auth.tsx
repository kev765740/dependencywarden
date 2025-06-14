import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@/types";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { secureStorage, migrateFromLocalStorage } from "@/lib/secureStorage";
import { secureValidationSchemas } from "@/lib/inputSanitization";
import { withRetry } from "@/lib/retryLogic";
import { authService } from "@/lib/authService";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<{ user: User; token: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User; token: string }, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Migrate from localStorage on app start
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await authService.getCurrentUser();
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    },
    initialData: () => {
      try {
        const storedUser = secureStorage.getUserData();
        const storedToken = secureStorage.getAuthToken();
        return storedUser && storedToken ? storedUser : null;
      } catch (error) {
        console.error('Error getting initial user data:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Use enhanced authentication service
      const result = await authService.login(credentials);
      if (!result.success || !result.user || !result.token) {
        throw new Error(result.error || 'Login failed');
        }
      return { 
        user: result.user, 
        token: result.token 
      };
    },
    onSuccess: (data) => {
      if (data.user && data.token) {
        secureStorage.setUserData(data.user);
        secureStorage.setAuthToken(data.token);
        queryClient.setQueryData(['user'], data.user);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        // Use React Router navigation instead of window.location
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.error('Login response missing required fields:', data);
        throw new Error('Invalid login response format');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Use enhanced authentication service
      const result = await authService.register(credentials);
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      // For registration, we need to login after successful registration
      const loginResult = await authService.login({
        email: credentials.email,
        password: credentials.password
      });
      if (!loginResult.success || !loginResult.user || !loginResult.token) {
        throw new Error('Registration successful but login failed');
        }
      return { 
        user: loginResult.user, 
        token: loginResult.token 
      };
    },
    onSuccess: (data) => {
      if (data.user && data.token) {
        secureStorage.setUserData(data.user);
        secureStorage.setAuthToken(data.token);
        queryClient.setQueryData(['user'], data.user);
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        // Use React Router navigation instead of window.location  
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.error('Registration response missing required fields:', data);
        throw new Error('Invalid registration response format');
      }
    },
    onError: (error: Error) => {
      // Show user-friendly error messages
      const isExistingUser = error.message.includes('already exists');
      toast({
        title: isExistingUser ? "Account exists" : "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use enhanced authentication service
      await authService.logout();
    },
    onSuccess: () => {
      secureStorage.clear();
      queryClient.setQueryData(['user'], null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login', { replace: true });
    },
    onError: (error: Error) => {
      // Clear local storage even if logout API fails
      secureStorage.clear();
      queryClient.setQueryData(['user'], null);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      navigate('/login', { replace: true });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        isAuthenticated: !!user,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };