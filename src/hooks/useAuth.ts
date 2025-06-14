import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  });
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setAuthState({ token: data.token, user: data.user });
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthState({ token: null, user: null });
    navigate('/login');
  }, [navigate]);

  return {
    user: authState.user,
    token: authState.token,
    login,
    logout,
    isAuthenticated: !!authState.token,
  };
}
