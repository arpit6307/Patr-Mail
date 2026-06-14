'use client';

import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { toggleStar } from '@/lib/firebase/firestore';
import { EmailItem } from './EmailItem';
import { MailOpen, Loader2 } from 'lucide-react';
import type { MailboxEntry } from '@/types/email';

interface EmailListProps {
  emails: MailboxEntry[];
  loading: boolean;
}

export function EmailList({ emails, loading }: EmailListProps) {
  const userId = useAuthStore((s) => s.user?.uid);
  const { selectedIds, toggleSelected } = useEmailStore((s) => ({
    selectedIds: s.selectedIds,
    toggleSelected: s.toggleSelected,
  }));

  const handleToggleStar = async (email: MailboxEntry) => {
    if (!userId) return;
    try {
      await toggleStar(userId, email.id, email.emailId, !email.isStarred);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 py-4 px-2 border-b border-border/20 animate-pulse">
            <div className="w-4 h-4 bg-muted rounded shrink-0" />
            <div className="w-4 h-4 bg-muted rounded shrink-0" />
            <div className="w-9 h-9 bg-muted rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
            <div className="w-12 h-3 bg-muted rounded shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5">
          <MailOpen className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1.5">Koi Patr Nahi Hai</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aapka yeh folder bilkul khali hai. Jab naye patr aayenge, tab yahan dikhenge! ✨
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {emails.map((email) => (
        <EmailItem
          key={email.id}
          email={email}
          selected={selectedIds.has(email.id)}
          onToggleSelect={() => toggleSelected(email.id)}
          onToggleStar={() => handleToggleStar(email)}
        />
      ))}
    </div>
  );
}
