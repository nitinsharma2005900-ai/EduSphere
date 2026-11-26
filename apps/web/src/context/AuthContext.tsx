'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'LEARNER' | 'INSTRUCTOR' | 'COURSE_AUTHOR' | 'ASSESSOR' | 'ADMIN';
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: 'LEARNER' | 'INSTRUCTOR' | 'COURSE_AUTHOR' | 'ASSESSOR' | 'ADMIN') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const DEMO_USERS = {
  ADMIN: { email: 'admin@edusphere.demo', role: 'ADMIN', name: 'Eleanor Vance (Admin)' },
  INSTRUCTOR: { email: 'instructor@edusphere.demo', role: 'INSTRUCTOR', name: 'Dr. Marcus Sterling (Instructor)' },
  COURSE_AUTHOR: { email: 'author@edusphere.demo', role: 'COURSE_AUTHOR', name: 'Sarah Chen (Author)' },
  ASSESSOR: { email: 'assessor@edusphere.demo', role: 'ASSESSOR', name: 'David Kowalski (Assessor)' },
  LEARNER: { email: 'learner@edusphere.demo', role: 'LEARNER', name: 'Alex Rivera (Learner)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage
    const savedToken = localStorage.getItem('edusphere_token');
    const savedUser = localStorage.getItem('edusphere_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('edusphere_token');
        localStorage.removeItem('edusphere_user');
      }
    } else {
      // Default to demo learner on first visit for zero-friction exploration
      loginDemo('LEARNER').catch(() => {});
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string = 'EduSphere2026!') => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setToken(data.tokens.accessToken);
      localStorage.setItem('edusphere_token', data.tokens.accessToken);
      localStorage.setItem('edusphere_user', JSON.stringify(data.user));
      localStorage.setItem('edusphere_refresh', data.tokens.refreshToken);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role: 'LEARNER' | 'INSTRUCTOR' | 'COURSE_AUTHOR' | 'ASSESSOR' | 'ADMIN') => {
    const demo = DEMO_USERS[role];
    await login(demo.email, 'EduSphere2026!');
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('edusphere_refresh');
    if (refreshToken) void apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem('edusphere_refresh');
    setUser(null);
    setToken(null);
    localStorage.removeItem('edusphere_token');
    localStorage.removeItem('edusphere_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
