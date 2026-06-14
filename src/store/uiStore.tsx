'use client';

import { createContext, useRef, useContext, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

// ─── Store Type ─────────────────────────────────────────

export type LayoutDensity = 'comfortable' | 'cozy' | 'compact';

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNavVisible: boolean;
  isMobile: boolean;
  density: LayoutDensity;
  keyboardShortcuts: boolean;
}

export interface UIActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavVisible: (visible: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setDensity: (density: LayoutDensity) => void;
  setKeyboardShortcuts: (enabled: boolean) => void;
}

export type UIStore = UIState & UIActions;

// ─── Store Factory ──────────────────────────────────────

export const createUIStore = (initialState: Partial<UIState> = {}) => {
  return createStore<UIStore>()((set) => ({
    theme: 'light',
    sidebarOpen: true,
    sidebarCollapsed: false,
    mobileNavVisible: true,
    isMobile: false,
    density: 'comfortable',
    keyboardShortcuts: false,
    ...initialState,

    setTheme: (theme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('patr-theme', theme);
      }
      set({ theme });
    },

    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          localStorage.setItem('patr-theme', newTheme);
        }
        return { theme: newTheme };
      }),

    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

    setMobileNavVisible: (mobileNavVisible) => set({ mobileNavVisible }),

    setIsMobile: (isMobile) => set({ isMobile }),

    setDensity: (density) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('patr-density', density);
      }
      set({ density });
    },

    setKeyboardShortcuts: (keyboardShortcuts) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('patr-shortcuts', String(keyboardShortcuts));
      }
      set({ keyboardShortcuts });
    },
  }));
};

// ─── Provider & Hook ────────────────────────────────────

export type UIStoreApi = ReturnType<typeof createUIStore>;

const UIStoreContext = createContext<UIStoreApi | undefined>(undefined);

export function UIStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<UIStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createUIStore();
  }

  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  );
}

export function useUIStore<T>(selector: (store: UIStore) => T): T {
  const context = useContext(UIStoreContext);
  if (!context) {
    throw new Error('useUIStore must be used within UIStoreProvider');
  }
  return useStore(context, selector);
}
