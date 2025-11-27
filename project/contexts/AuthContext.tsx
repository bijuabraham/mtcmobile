import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  donorNumber?: string;
  isApproved?: boolean;
  profileComplete?: boolean;
  isSuspended?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  isPendingApproval: boolean;
  isApproved: boolean;
  isSuspended: boolean;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (firstName: string, lastName: string, donorNumber: string) => Promise<void>;
  getLoginUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signOut = async () => {
    try {
      await api.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setUser(null);
  };

  const completeProfile = async (firstName: string, lastName: string, donorNumber: string) => {
    const data = await api.completeProfile(firstName, lastName, donorNumber);
    if (data.user) {
      setUser(data.user);
    }
  };

  const getLoginUrl = () => {
    return api.getLoginUrl();
  };

  const needsProfileCompletion = user !== null && user.profileComplete === false;
  const isPendingApproval = user !== null && user.profileComplete === true && user.isApproved === false;
  const isApproved = user !== null && user.profileComplete === true && user.isApproved === true;
  const isSuspended = user !== null && user.isSuspended === true;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      needsProfileCompletion,
      isPendingApproval,
      isApproved,
      isSuspended,
      checkAuth,
      signOut,
      completeProfile,
      getLoginUrl
    }}>
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
