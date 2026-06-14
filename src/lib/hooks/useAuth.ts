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
        // Try to load user data from cache first for instant loading
        let cachedUser: User | null = null;
        try {
          const cachedData = localStorage.getItem(`patr_user_${firebaseUser.uid}`);
          if (cachedData) {
            cachedUser = JSON.parse(cachedData) as User;
            setUser(cachedUser);
            setLoading(false);
          }
        } catch (e) {
          console.error('Error reading auth cache:', e);
        }

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            const userDataStr = JSON.stringify(userData);
            const cachedDataStr = localStorage.getItem(`patr_user_${firebaseUser.uid}`);
            
            if (userDataStr !== cachedDataStr) {
              localStorage.setItem(`patr_user_${firebaseUser.uid}`, userDataStr);
              setUser(userData);
            }
          } else {
            // User exists in Auth but not in Firestore yet
            // Wait for registration flow to complete Firestore write
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
          if (!cachedUser) {
            setUser(null);
          }
        }
      } else {
        // Clear caches on sign out
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('patr_user_')) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {}
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
