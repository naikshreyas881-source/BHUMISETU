import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import type { User, UserRole, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: UserRole;
    preferred_language?: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bhumisetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bhumisetu_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('bhumisetu_token');
      if (savedToken) {
        try {
          const res = await apiClient.get<User>('/auth/me');
          setUser(res.data);
          localStorage.setItem('bhumisetu_user', JSON.stringify(res.data));
        } catch {
          localStorage.removeItem('bhumisetu_token');
          localStorage.removeItem('bhumisetu_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user: loggedUser } = response.data;
    localStorage.setItem('bhumisetu_token', access_token);
    localStorage.setItem('bhumisetu_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: UserRole;
    preferred_language?: string;
  }) => {
    await apiClient.post<User>('/auth/register', data);
    // After registration, auto-login
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem('bhumisetu_token');
    localStorage.removeItem('bhumisetu_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
