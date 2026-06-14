'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Select values individually to prevent object-literal recreation causing unnecessary renders
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            setUser(userData);
          } else {
            // User exists in Auth but not in Firestore yet
            // Wait for registration flow to complete Firestore write
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = ['/login', '/register', '/reset-password', '/'].includes(pathname || '');

    if (!isAuthenticated && !isAuthRoute) {
      if (lastRedirectRef.current !== '/login') {
        lastRedirectRef.current = '/login';
        router.push('/login');
      }
    } else if (isAuthenticated && isAuthRoute) {
      if (lastRedirectRef.current !== '/inbox') {
        lastRedirectRef.current = '/inbox';
        router.push('/inbox');
      }
    } else {
      // Clear redirect state when matching correctly
      lastRedirectRef.current = null;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { user, isLoading, isAuthenticated };
}
