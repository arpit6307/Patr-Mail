'use client';

import { createContext, useRef, useContext, useEffect, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

// ─── Notification Types ─────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'email' | 'security' | 'system' | 'storage';
  isRead: boolean;
  receivedAt: string; // ISO String
  actionUrl?: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NotificationActions {
  addNotification: (title: string, message: string, type: NotificationItem['type'], actionUrl?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: NotificationItem[]) => void;
}

export type NotificationStore = NotificationState & NotificationActions;

// ─── Tone Synthesizer ───────────────────────────────────

function playChime() {
  try {
    const soundPref = localStorage.getItem('patr_pref_sound') !== 'false';
    if (!soundPref) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Tone 1 (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Tone 2 (A5 - 880 Hz) - a perfect fifth higher for a pleasant alert
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('Audio Context failed to initialize:', e);
  }
}

// ─── Store Factory ──────────────────────────────────────

export const createNotificationStore = (initialState: Partial<NotificationState> = {}) => {
  return createStore<NotificationStore>()((set, get) => ({
    notifications: [],
    unreadCount: 0,
    ...initialState,

    addNotification: (title, message, type, actionUrl) => {
      const newItem: NotificationItem = {
        id: Math.random().toString(36).substring(7),
        title,
        message,
        type,
        isRead: false,
        receivedAt: new Date().toISOString(),
        actionUrl,
      };

      const notifications = [newItem, ...get().notifications];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });

      // Play audio chime
      playChime();

      // Trigger Web Notification if allowed
      const notifyPref = localStorage.getItem('patr_pref_notify') !== 'false';
      if (notifyPref && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    },

    markAsRead: (id) => {
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });
    },

    markAllAsRead: () => {
      const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({
        notifications,
        unreadCount: 0,
      });
    },

    clearNotification: (id) => {
      const notifications = get().notifications.filter((n) => n.id !== id);
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });
    },

    clearAll: () => {
      set({ notifications: [], unreadCount: 0 });
    },

    setNotifications: (notifications) => {
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });
    },
  }));
};

// ─── Provider & Hook ────────────────────────────────────

export type NotificationStoreApi = ReturnType<typeof createNotificationStore>;

const NotificationStoreContext = createContext<NotificationStoreApi | undefined>(undefined);

export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<NotificationStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createNotificationStore();
  }

  // Load and sync with localStorage
  useEffect(() => {
    if (storeRef.current) {
      try {
        const stored = localStorage.getItem('patr_notifications');
        if (stored) {
          storeRef.current.getState().setNotifications(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load notifications from cache:', e);
      }

      // Request browser permission for popup notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Subscribe to changes to save to localStorage
      const unsubscribe = storeRef.current.subscribe((state) => {
        localStorage.setItem('patr_notifications', JSON.stringify(state.notifications));
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <NotificationStoreContext.Provider value={storeRef.current}>
      {children}
    </NotificationStoreContext.Provider>
  );
}

export function useNotificationStore<T>(selector: (store: NotificationStore) => T): T {
  const context = useContext(NotificationStoreContext);
  if (!context) {
    throw new Error('useNotificationStore must be used within NotificationStoreProvider');
  }
  return useStore(context, selector);
}
