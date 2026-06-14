'use client';

import { useRouter } from 'next/navigation';
import { Star, Paperclip } from 'lucide-react';
import type { MailboxEntry } from '@/types/email';
import { formatEmailDate, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

interface EmailItemProps {
  email: MailboxEntry;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

export function EmailItem({
  email,
  selected,
  onToggleSelect,
  onToggleStar,
}: EmailItemProps) {
  const router = useRouter();
  const density = useUIStore((s) => s.density);

  const handleRowClick = () => {
    router.push(`/email/${email.emailId}`);
  };

  const initials = getInitials(email.senderName);
  const avatarBg = getAvatarColor(email.senderName);

  // Density spacing and font sizes
  const paddingClass = 
    density === 'compact' ? 'py-1.5 gap-2.5' : 
    density === 'cozy' ? 'py-2.5 gap-3.5' : 
    'py-3.5 gap-4';
  
  const avatarClass = 
    density === 'compact' ? 'w-7.5 h-7.5 text-[10px]' : 
    density === 'cozy' ? 'w-8.5 h-8.5 text-[11px]' : 
    'w-9.5 h-9.5 text-xs';

  const textClass = 
    density === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <div
      onClick={handleRowClick}
      data-unread={!email.isRead}
      className={cn(
        'email-item group flex items-center border-b border-border/40 cursor-pointer transition-all hover:bg-muted/30 select-none',
        paddingClass,
        !email.isRead && 'bg-primary/5 dark:bg-primary/[0.03]'
      )}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(e);
        }}
        className="flex items-center justify-center p-1 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="w-4 h-4 rounded border-border text-patr-orange focus:ring-patr-orange cursor-pointer"
        />
      </div>

      {/* Star */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(e);
        }}
        className={cn(
          'p-1 text-muted-foreground hover:text-amber-500 transition-colors',
          email.isStarred && 'text-amber-500 hover:text-amber-600'
        )}
      >
        <Star className="w-4.5 h-4.5" fill={email.isStarred ? 'currentColor' : 'none'} />
      </button>

      {/* Avatar */}
      <div
        className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm", avatarClass)}
        style={{ backgroundColor: avatarBg }}
      >
        {initials}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
        {/* Sender Name */}
        <div className="min-w-0 md:col-span-1">
          <p
            className={cn(
              textClass,
              'text-foreground truncate',
              !email.isRead ? 'font-bold' : 'font-medium'
            )}
          >
            {email.senderName}
          </p>
        </div>

        {/* Subject & Preview */}
        <div className="min-w-0 md:col-span-3 flex items-center gap-2">
          <p className={cn(textClass, "truncate")}>
            <span className={cn('text-foreground', !email.isRead ? 'font-semibold' : 'font-normal')}>
              {email.subject || '(No Subject)'}
            </span>
            <span className="text-muted-foreground/80 font-normal">
              {' — '}
              {email.preview}
            </span>
          </p>
        </div>
      </div>

      {/* Right Icons / Date */}
      <div className="flex items-center gap-3 shrink-0">
        {email.hasAttachments && (
          <Paperclip className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        )}
        <span className="text-xs font-medium text-muted-foreground/80 whitespace-nowrap">
          {formatEmailDate(email.receivedAt)}
        </span>
      </div>
    </div>
  );
}
