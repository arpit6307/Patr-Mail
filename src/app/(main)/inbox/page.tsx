'use client';

import { useEffect } from 'react';
import { useEmailStore } from '@/store/emailStore';
import { useAuthStore } from '@/store/authStore';
import { useEmails } from '@/lib/hooks/useEmails';
import { EmailList } from '@/components/email/EmailList';
import { bulkMoveToFolder, bulkMarkRead } from '@/lib/firebase/firestore';
import { CheckSquare, Square, Archive, Trash2, Mail, RefreshCw, Layers, Users, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InboxPage() {
  const userId = useAuthStore((s) => s.user?.uid);
  const currentCategory = useEmailStore((s) => s.currentCategory);
  const selectedIds = useEmailStore((s) => s.selectedIds);
  const setCurrentFolder = useEmailStore((s) => s.setCurrentFolder);
  const setCurrentCategory = useEmailStore((s) => s.setCurrentCategory);
  const selectAll = useEmailStore((s) => s.selectAll);
  const clearSelection = useEmailStore((s) => s.clearSelection);
  const selectedLabel = useEmailStore((s) => s.selectedLabel);
  const setSelectedLabel = useEmailStore((s) => s.setSelectedLabel);

  // Force folder to 'inbox' when loading this page
  useEffect(() => {
    setCurrentFolder('inbox');
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

  const handleBulkAction = async (action: 'archive' | 'trash' | 'read') => {
    if (!userId || selectedIds.size === 0) return;
    const entries = Array.from(selectedIds).map((id) => {
      const email = emails.find((e) => e.id === id);
      return { mailboxId: id, emailId: email?.emailId || '' };
    });

    try {
      if (action === 'read') {
        await bulkMarkRead(userId, entries);
      } else {
        await bulkMoveToFolder(userId, entries, action === 'archive' ? 'archive' : 'trash');
      }
      clearSelection();
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
    }
  };

  const categories = [
    { id: 'primary', label: 'Primary', icon: Layers, color: 'text-patr-orange' },
    { id: 'social', label: 'Social', icon: Users, color: 'text-blue-500' },
    { id: 'promotions', label: 'Promotions', icon: Megaphone, color: 'text-emerald-500' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search and refresh bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur sticky top-16 z-10 gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Select Checkbox */}
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

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <button
                onClick={() => handleBulkAction('archive')}
                title="Archive Selected"
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Archive className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleBulkAction('trash')}
                title="Delete Selected"
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleBulkAction('read')}
                title="Mark Selected Read"
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Mail className="w-5 h-5" />
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

      {/* Category Tabs */}
      <div className="flex border-b border-border/30 bg-card/10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCurrentCategory(cat.id);
                clearSelection();
              }}
              className={cn(
                'flex items-center gap-2.5 px-6 py-3.5 border-b-2 font-semibold text-sm transition-all focus:outline-none flex-1 sm:flex-initial text-center justify-center',
                active
                  ? 'border-patr-orange text-patr-orange bg-patr-orange/[0.02]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
              )}
            >
              <Icon className={cn('w-4.5 h-4.5', cat.color)} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Label Filter Info */}
      {selectedLabel && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-patr-orange/[0.04] border-b border-border/30 animate-fade-in select-none">
          <span className="text-xs font-semibold text-muted-foreground">Filtered by label:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-patr-orange/15 text-patr-orange border border-patr-orange/25">
            {selectedLabel}
            <button
              onClick={() => setSelectedLabel(null)}
              className="hover:text-red-500 transition-colors p-0.5"
              title="Clear Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Email List container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <EmailList emails={emails} loading={loading} />
      </div>
    </div>
  );
}
