'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export type Role = 'user' | 'admin';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: any; // Firebase User type
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [role, setRoleState] = useState<Role>('user');
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        setRoleState(userDoc.data().role as Role);
      } else {
        // Fallback for new users if not handled during signup
        setRoleState('user');
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setRoleState('user');
        setLoading(false);
        // Route groups are not part of URL, so this targets src/app/(auth)/signin/page.tsx
        router.replace('/signin');
      }
    }
  }, [user, isUserLoading, firestore, router]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    // Note: In a real app, you might want to sync this to Firestore here if needed,
    // but usually roles are assigned by an admin or during signup.
  };

  return (
    <AppContext.Provider value={{ role, setRole, user, loading }}>
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
