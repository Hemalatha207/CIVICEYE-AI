import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  isCitizen: boolean;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('civiceye_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('civiceye_token');
      const storedUser = localStorage.getItem('civiceye_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh user profile in background
          const res = await authApi.me();
          setUser(res.data);
          localStorage.setItem('civiceye_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired, please re-login');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('civiceye_token', access_token);
    localStorage.setItem('civiceye_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: any): Promise<User> => {
    const res = await authApi.register(data);
    const { access_token, user: registeredUser } = res.data;
    localStorage.setItem('civiceye_token', access_token);
    localStorage.setItem('civiceye_user', JSON.stringify(registeredUser));
    setToken(access_token);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('civiceye_token');
    localStorage.removeItem('civiceye_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (roleName: string) => {
    if (!user) return false;
    return user.roles.some((r) => r.name.toUpperCase() === roleName.toUpperCase());
  };

  const isCitizen = hasRole('CITIZEN');
  const isManager = hasRole('MANAGER') || hasRole('ADMIN');
  const isAdmin = hasRole('ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isCitizen,
        isManager,
        isAdmin,
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
