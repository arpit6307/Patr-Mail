'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { EmailList } from '@/components/email/EmailList';
import { subscribeToAllMailbox } from '@/lib/firebase/firestore';
import type { MailboxEntry } from '@/types/email';
import { Search, Loader2 } from 'lucide-react';

export default function SearchPage() {
  const userId = useAuthStore((s) => s.user?.uid);
  const searchQuery = useEmailStore((s) => s.searchQuery);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);
  
  const [allEmails, setAllEmails] = useState<MailboxEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribe = subscribeToAllMailbox(userId, 100, (emails) => {
      setAllEmails(emails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Filter based on search query
  const filteredEmails = allEmails.filter((email) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      email.senderName?.toLowerCase().includes(q) ||
      email.senderEmail?.toLowerCase().includes(q) ||
      email.subject?.toLowerCase().includes(q) ||
      email.preview?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      {/* Header Info */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur sticky top-16 z-10 gap-4">
        <div className="flex items-center gap-2.5">
          <Search className="w-5 h-5 text-patr-orange animate-pulse" />
          <h1 className="text-base font-bold text-foreground">Global Search</h1>
        </div>
        <span className="text-xs text-muted-foreground font-semibold">
          {searchQuery.trim() ? `${filteredEmails.length} matching emails` : 'Type in search bar to begin'}
        </span>
      </div>

      {/* Search Input for Mobile/Tablet View (since main header search is hidden) */}
      <div className="p-4 border-b border-border/30 bg-muted/10 md:hidden animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all emails..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border/60
                       placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-patr-orange transition-all"
          />
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-patr-orange" />
          </div>
        ) : searchQuery.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 animate-fade-in">
            <div className="p-4 rounded-full bg-patr-orange/10 border border-patr-orange/20 mb-4">
              <Search className="w-8 h-8 text-patr-orange" />
            </div>
            <p className="text-sm font-bold text-foreground">Search query enter karein</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-medium">
              Upar diye gaye search bar mein sender, subject ya keywords type karke search shuru karein.
            </p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 animate-fade-in">
            <div className="p-4 rounded-full bg-muted/60 mb-4 border border-border/40">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Koi result nahi mila</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-medium">
              Aapke query &quot;{searchQuery}&quot; se match hone wala koi email nahi mila. Dusra keyword use karein.
            </p>
          </div>
        ) : (
          <EmailList emails={filteredEmails} loading={false} />
        )}
      </div>
    </div>
  );
}
