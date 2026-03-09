'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'user' | 'admin';

export interface SessionUser {
  uid: string;
  email: string;
  username: string;
  role: Role;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: SessionUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRoleState] = useState<Role>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setRoleState(data.user.role);
        } else {
          router.replace('/signin');
        }
      })
      .catch(() => router.replace('/signin'))
      .finally(() => setLoading(false));
  }, [router]);

  const setRole = (newRole: Role) => setRoleState(newRole);

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    setRoleState('user');
    router.replace('/signin');
  };

  return (
    <AppContext.Provider value={{ role, setRole, user, loading, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
