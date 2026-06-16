'use client';

import { useRouter } from 'next/navigation';
import { Star, Paperclip } from 'lucide-react';
import type { MailboxEntry } from '@/types/email';
import { formatEmailDate, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useUserAvatar } from '@/lib/hooks/useUserAvatar';

interface EmailItemProps {
  email: MailboxEntry;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
  accountEmail?: string;
  onRowClick?: () => void;
}

export function EmailItem({
  email,
  selected,
  onToggleSelect,
  onToggleStar,
  accountEmail,
  onRowClick,
}: EmailItemProps) {
  const router = useRouter();
  const density = useUIStore((s) => s.density);
  const user = useAuthStore((s) => s.user);
  const customLabels = user?.labels || [];
  const { photoURL } = useUserAvatar(email.senderEmail);

  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick();
    } else {
      router.push(`/email/${email.emailId}`);
    }
  };

  const initials = getInitials(email.senderName);
  const avatarBg = getAvatarColor(email.senderName);

  // Density spacing and font sizes
  const paddingClass = 
    density === 'compact' ? 'py-1.5 gap-2.5' : 
    density === 'cozy' ? 'py-2.5 gap-3.5' : 
    'py-3.5 gap-4';
  
  const avatarClass = 
    density === 'compact' ? 'w-8 h-8 text-[10px]' : 
    density === 'cozy' ? 'w-9 h-9 text-[11px]' : 
    'w-10 h-10 text-xs';

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
      {/* Checkbox (Desktop only) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(e);
        }}
        className="hidden md:flex items-center justify-center p-1 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="w-4 h-4 rounded border-border text-patr-orange focus:ring-patr-orange cursor-pointer"
        />
      </div>

      {/* Star (Desktop only) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(e);
        }}
        className={cn(
          'hidden md:block p-1 text-muted-foreground hover:text-amber-500 transition-colors',
          email.isStarred && 'text-amber-500 hover:text-amber-600'
        )}
      >
        <Star className="w-4.5 h-4.5" fill={email.isStarred ? 'currentColor' : 'none'} />
      </button>

      {/* Avatar (All screens) */}
      <div
        className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden", avatarClass)}
        style={{ backgroundColor: photoURL ? undefined : avatarBg }}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={email.senderName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundColor = avatarBg;
                parent.innerText = initials;
              }
            }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Mobile Layout (Visible on mobile/tablet, hidden on desktop) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 md:hidden">
        {/* Line 1: Sender Name & Date */}
        <div className="flex justify-between items-baseline gap-2">
          <p className={cn("text-sm text-foreground truncate", !email.isRead ? "font-bold" : "font-semibold")}>
            {email.senderName}
          </p>
          <span className="text-xs text-muted-foreground/80 shrink-0 whitespace-nowrap font-medium">
            {formatEmailDate(email.receivedAt)}
          </span>
        </div>

        {/* Line 2: Subject & Icons */}
        <div className="flex justify-between items-center gap-2">
          <p className={cn("text-xs truncate flex-1", !email.isRead ? "font-bold text-foreground" : "text-muted-foreground/90 font-medium")}>
            {accountEmail && (
              <span className="px-1.5 py-0.5 rounded bg-patr-orange/15 text-patr-orange border border-patr-orange/20 text-[9px] font-black shrink-0 uppercase tracking-wider select-none mr-1.5">
                {accountEmail.split('@')[0]}
              </span>
            )}
            {email.subject || '(No Subject)'}
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            {email.hasAttachments && (
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(e);
              }}
              className={cn(
                'p-0.5 text-muted-foreground hover:text-amber-500 transition-colors',
                email.isStarred && 'text-amber-500'
              )}
            >
              <Star className="w-4 h-4" fill={email.isStarred ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Line 3: Preview & Chips */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground/70 truncate flex-1">
            {email.preview}
          </p>
          {email.labels && email.labels.length > 0 && (
            <div className="flex gap-1 shrink-0 select-none overflow-x-auto scrollbar-none max-w-[120px]">
              {email.labels.map((lbl) => {
                const configuredLabel = customLabels.find((l) => l.name === lbl);
                const colorClass = configuredLabel?.color || 'bg-muted';
                return (
                  <span
                    key={lbl}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold text-white shrink-0 shadow-sm",
                      colorClass
                    )}
                  >
                    {lbl}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout (Hidden on mobile/tablet, visible on desktop) */}
      <div className="hidden md:grid flex-1 min-w-0 grid-cols-4 gap-2 items-center">
        {/* Sender Name */}
        <div className="min-w-0 col-span-1">
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
        <div className="min-w-0 col-span-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {accountEmail && (
              <span className="px-1.5 py-0.5 rounded bg-patr-orange/15 text-patr-orange border border-patr-orange/20 text-[9px] font-black shrink-0 uppercase tracking-wider select-none">
                {accountEmail.split('@')[0]}
              </span>
            )}
            <p className={cn(textClass, "truncate flex-1")}>
              <span className={cn('text-foreground', !email.isRead ? 'font-semibold' : 'font-normal')}>
                {email.subject || '(No Subject)'}
              </span>
              <span className="text-muted-foreground/80 font-normal">
                {' — '}
                {email.preview}
              </span>
            </p>
            {email.labels && email.labels.length > 0 && (
              <div className="flex gap-1 shrink-0 select-none overflow-x-auto scrollbar-none">
                {email.labels.map((lbl) => {
                  const configuredLabel = customLabels.find((l) => l.name === lbl);
                  const colorClass = configuredLabel?.color || 'bg-muted';
                  return (
                    <span
                      key={lbl}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 shadow-sm",
                        colorClass
                      )}
                    >
                      {lbl}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Right Icons / Date (Hidden on mobile/tablet, visible on desktop) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
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
