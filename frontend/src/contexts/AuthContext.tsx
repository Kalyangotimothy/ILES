import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthTokens, LoginCredentials } from '@/types';
import { authApi, usersApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;  
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          const userData = await usersApi.getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('tokens');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const tokens: AuthTokens = await authApi.login(credentials);
    localStorage.setItem('tokens', JSON.stringify(tokens));
    const userData = await usersApi.getMe();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tokens');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
