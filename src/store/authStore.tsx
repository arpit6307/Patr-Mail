'use client';

import { createContext, useRef, useContext, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import type { User } from '@/types/user';

// ─── Store Type ─────────────────────────────────────────

export interface AuthState {
  user: User | null;
  firebaseUser: { uid: string; email: string | null; displayName: string | null } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: { uid: string; email: string | null; displayName: string | null } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

// ─── Store Factory (SSR-safe) ───────────────────────────

export const createAuthStore = (initialState: Partial<AuthState> = {}) => {
  return createStore<AuthStore>()((set) => ({
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    ...initialState,

    setUser: (user) =>
      set({ user, isAuthenticated: !!user, isLoading: false }),

    setFirebaseUser: (firebaseUser) =>
      set({ firebaseUser }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error, isLoading: false }),

    clearError: () => set({ error: null }),

    logout: () =>
      set({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }),
  }));
};

// ─── Provider & Hook (SSR-safe pattern) ─────────────────

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

const AuthStoreContext = createContext<AuthStoreApi | undefined>(undefined);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AuthStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createAuthStore();
  }

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore<T>(selector: (store: AuthStore) => T): T {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }
  return useStore(context, selector);
}
