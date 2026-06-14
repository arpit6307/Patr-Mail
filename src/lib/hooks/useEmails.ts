'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { subscribeToMailbox } from '@/lib/firebase/firestore';
import type { MailboxEntry } from '@/types/email';

export function useEmails() {
  const userId = useAuthStore((s) => s.user?.uid);
  
  // Select values individually to prevent object-literal recreation causing unnecessary renders
  const emails = useEmailStore((s) => s.emails);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const currentCategory = useEmailStore((s) => s.currentCategory);
  const selectedLabel = useEmailStore((s) => s.selectedLabel);
  const setEmails = useEmailStore((s) => s.setEmails);
  const isLoading = useEmailStore((s) => s.isLoading);
  const setLoading = useEmailStore((s) => s.setLoading);

  const [hasMore, setHasMore] = useState(false);
  const pageSize = 50;

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    // Subscribe to mailbox changes in Firestore
    const unsubscribe = subscribeToMailbox(
      userId,
      currentFolder,
      currentFolder === 'inbox' ? currentCategory : null,
      pageSize,
      (newEmails, moreAvailable) => {
        setEmails(newEmails);
        setHasMore(moreAvailable);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, currentFolder, currentCategory, setEmails, setLoading]);

  const filteredEmails = selectedLabel
    ? emails.filter((email) => email.labels?.includes(selectedLabel))
    : emails;

  return { emails: filteredEmails, loading: isLoading, hasMore };
}
