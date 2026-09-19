import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  school: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('chat_token');
      if (token) {
        try {
          const { data } = await API.get('/auth/me');
          setUser(data);
        } catch (error) {
          console.error('Session expired or invalid');
          localStorage.removeItem('chat_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (userData.token) {
      localStorage.setItem('chat_token', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chat_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
