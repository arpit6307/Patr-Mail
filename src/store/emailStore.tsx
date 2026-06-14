'use client';

import { createContext, useRef, useContext, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import type { MailboxEntry, EmailCategory, Email } from '@/types/email';

// ─── Store Type ─────────────────────────────────────────

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash' | 'archive' | 'spam';

export interface EmailState {
  emails: MailboxEntry[];
  currentEmail: Email | null;
  currentFolder: EmailFolder;
  currentCategory: EmailCategory;
  selectedIds: Set<string>;
  isLoading: boolean;
  isComposing: boolean;
  composeData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    replyToId?: string;
    forwardFromId?: string;
    draftId?: string;
  } | null;
  searchQuery: string;
  hasMore: boolean;
}

export interface EmailActions {
  setEmails: (emails: MailboxEntry[]) => void;
  addEmails: (emails: MailboxEntry[]) => void;
  setCurrentEmail: (email: Email | null) => void;
  setCurrentFolder: (folder: EmailFolder) => void;
  setCurrentCategory: (category: EmailCategory) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  openCompose: (data?: EmailState['composeData']) => void;
  closeCompose: () => void;
  setSearchQuery: (query: string) => void;
  setHasMore: (hasMore: boolean) => void;
  updateEmailInList: (emailId: string, updates: Partial<MailboxEntry>) => void;
  removeEmailFromList: (emailId: string) => void;
}

export type EmailStore = EmailState & EmailActions;

// ─── Store Factory ──────────────────────────────────────

export const createEmailStore = (initialState: Partial<EmailState> = {}) => {
  return createStore<EmailStore>()((set, get) => ({
    emails: [],
    currentEmail: null,
    currentFolder: 'inbox',
    currentCategory: 'primary',
    selectedIds: new Set<string>(),
    isLoading: true,
    isComposing: false,
    composeData: null,
    searchQuery: '',
    hasMore: false,
    ...initialState,

    setEmails: (emails) => set({ emails, isLoading: false }),

    addEmails: (emails) =>
      set((state) => ({ emails: [...state.emails, ...emails] })),

    setCurrentEmail: (currentEmail) => set({ currentEmail }),

    setCurrentFolder: (currentFolder) =>
      set({ currentFolder, emails: [], isLoading: true, selectedIds: new Set() }),

    setCurrentCategory: (currentCategory) => set({ currentCategory }),

    toggleSelected: (id) =>
      set((state) => {
        const next = new Set(state.selectedIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return { selectedIds: next };
      }),

    selectAll: () =>
      set((state) => ({
        selectedIds: new Set(state.emails.map((e) => e.emailId)),
      })),

    clearSelection: () => set({ selectedIds: new Set() }),

    setLoading: (isLoading) => set({ isLoading }),

    openCompose: (data) =>
      set({
        isComposing: true,
        composeData: data || { to: [], cc: [], bcc: [], subject: '', body: '' },
      }),

    closeCompose: () => set({ isComposing: false, composeData: null }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setHasMore: (hasMore) => set({ hasMore }),

    updateEmailInList: (emailId, updates) =>
      set((state) => ({
        emails: state.emails.map((e) =>
          e.emailId === emailId ? { ...e, ...updates } : e
        ),
      })),

    removeEmailFromList: (emailId) =>
      set((state) => ({
        emails: state.emails.filter((e) => e.emailId !== emailId),
      })),
  }));
};

// ─── Provider & Hook ────────────────────────────────────

export type EmailStoreApi = ReturnType<typeof createEmailStore>;

const EmailStoreContext = createContext<EmailStoreApi | undefined>(undefined);

export function EmailStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<EmailStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createEmailStore();
  }

  return (
    <EmailStoreContext.Provider value={storeRef.current}>
      {children}
    </EmailStoreContext.Provider>
  );
}

export function useEmailStore<T>(selector: (store: EmailStore) => T): T {
  const context = useContext(EmailStoreContext);
  if (!context) {
    throw new Error('useEmailStore must be used within EmailStoreProvider');
  }
  return useStore(context, selector);
}
