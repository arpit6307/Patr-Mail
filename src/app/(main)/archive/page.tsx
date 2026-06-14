'use client';

import { useEffect } from 'react';
import { useEmailStore } from '@/store/emailStore';
import { useAuthStore } from '@/store/authStore';
import { useEmails } from '@/lib/hooks/useEmails';
import { EmailList } from '@/components/email/EmailList';
import { bulkMoveToFolder } from '@/lib/firebase/firestore';
import { CheckSquare, Square, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ArchivePage() {
  const userId = useAuthStore((s) => s.user?.uid);
  const selectedIds = useEmailStore((s) => s.selectedIds);
  const setCurrentFolder = useEmailStore((s) => s.setCurrentFolder);
  const selectAll = useEmailStore((s) => s.selectAll);
  const clearSelection = useEmailStore((s) => s.clearSelection);

  // Force folder to 'archive'
  useEffect(() => {
    setCurrentFolder('archive');
    clearSelection();
  }, [setCurrentFolder, clearSelection]);

  const { emails, loading } = useEmails();

  const isAllSelected = emails.length > 0 && selectedIds.size === emails.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedIds.size === 0) return;
    const entries = Array.from(selectedIds).map((id) => {
      const email = emails.find((e) => e.id === id);
      return { mailboxId: id, emailId: email?.emailId || '' };
    });

    try {
      await bulkMoveToFolder(userId, entries, 'trash');
      clearSelection();
    } catch (error) {
      console.error('Error archiving/deleting emails:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search and refresh bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur sticky top-16 z-10 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={handleSelectAllToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-5 h-5 text-patr-orange" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <button
                onClick={handleBulkDelete}
                title="Delete Selected"
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <span className="text-xs text-muted-foreground font-semibold ml-2">
                {selectedIds.size} selected
              </span>
            </div>
          )}
        </div>

        <button
          onClick={clearSelection}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors shrink-0"
        >
          <RefreshCw className={cn('w-4.5 h-4.5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="px-6 py-3 border-b border-border/30 bg-card/5">
        <h2 className="text-sm font-bold text-foreground">Archived Mails</h2>
      </div>

      {/* Email List container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <EmailList emails={emails} loading={loading} />
      </div>
    </div>
  );
}
