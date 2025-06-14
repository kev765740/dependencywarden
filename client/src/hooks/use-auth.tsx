import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { secureStorage, migrateFromLocalStorage } from "@/lib/secureStorage";
import { secureValidationSchemas } from "@/lib/inputSanitization";
import { withRetry } from "@/lib/retryLogic";

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

  // Migrate from localStorage on app start
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        // Check for stored user in secure storage
        const storedUser = secureStorage.getUserData();
        const storedToken = secureStorage.getAuthToken();

        if (storedUser && storedToken) {
          try {
            const response = await withRetry(() => apiRequest("GET", "/api/auth/user"));
            return await response.json();
          } catch (error) {
            // If API call fails, clear invalid credentials
            secureStorage.clear();
            return null;
          }
        }
        return null;
      } catch (error) {
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Validate credentials with secure schemas
        const validatedCredentials = {
          email: secureValidationSchemas.email.parse(credentials.email),
          password: credentials.password // Don't log or transform password
        };

        const res = await withRetry(() => 
          apiRequest("POST", "/api/auth/login", validatedCredentials)
        );
        return await res.json();
      } catch (error: any) {
        // Handle authentication errors gracefully
        if (error.message?.includes('401:') || error.message?.includes('Invalid credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (error.message?.includes('400:')) {
          throw new Error('Please enter both email and password.');
        }
        // Generic error for other cases
        throw new Error('Unable to sign in. Please try again.');
      }
    },
    onSuccess: (data) => {
      if (data.success && data.user && data.token) {
        secureStorage.setUserData(data.user);
        secureStorage.setAuthToken(data.token);
        queryClient.setQueryData(["/api/auth/user"], data.user);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        // Redirect to dashboard after successful login
        window.location.href = '/';
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
      try {
        // Validate all registration data with secure schemas
        const validatedCredentials = {
          email: secureValidationSchemas.email.parse(credentials.email),
          password: secureValidationSchemas.password.parse(credentials.password),
          firstName: credentials.firstName ? secureValidationSchemas.name.parse(credentials.firstName) : undefined,
          lastName: credentials.lastName ? secureValidationSchemas.name.parse(credentials.lastName) : undefined
        };

        const res = await withRetry(() => 
          apiRequest("POST", "/api/auth/register", validatedCredentials)
        );
        return await res.json();
      } catch (error: any) {
        // Handle registration errors gracefully
        if (error.message?.includes('409:') || error.message?.includes('Account already exists')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        if (error.message?.includes('400:')) {
          throw new Error('Please fill in all required fields.');
        }
        // Generic error for other cases
        throw new Error('Unable to create account. Please try again.');
      }
    },
    onSuccess: (data) => {
      if (data.success && data.user && data.token) {
        secureStorage.setUserData(data.user);
        secureStorage.setAuthToken(data.token);
        queryClient.setQueryData(["/api/auth/user"], data.user);
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
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
      await withRetry(() => apiRequest("POST", "/api/auth/logout"));
    },
    onSuccess: () => {
      secureStorage.clear();
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      // Clear local storage even if logout API fails
      secureStorage.clear();
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
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