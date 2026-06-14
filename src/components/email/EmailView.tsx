'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Trash2,
  Archive,
  CornerUpLeft,
  CornerUpRight,
  ReplyAll,
  Printer,
  Download,
  FileText,
  Paperclip,
} from 'lucide-react';
import type { Email } from '@/types/email';
import { formatFullDate, getInitials, getAvatarColor, sanitizeHTML, cn, formatFileSize } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { toggleStar, moveToFolder } from '@/lib/firebase/firestore';

interface EmailViewProps {
  email: Email;
  mailboxId: string; // The specific mailbox entry ID for operations
}

export function EmailView({ email, mailboxId }: EmailViewProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.uid);
  const openCompose = useEmailStore((s) => s.openCompose);

  const handleBack = () => {
    router.back();
  };

  const handleToggleStar = async () => {
    if (!userId) return;
    try {
      await toggleStar(userId, mailboxId, email.id, !email.isStarred);
      // Reload page to reflect updated star state
      router.refresh();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleMoveFolder = async (folder: 'archive' | 'trash') => {
    if (!userId) return;
    try {
      await moveToFolder(userId, mailboxId, folder);
      router.push('/inbox');
    } catch (error) {
      console.error(`Error moving to ${folder}:`, error);
    }
  };

  const handleReply = (type: 'reply' | 'reply-all' | 'forward') => {
    const replySubject = email.subject.startsWith('Re:') || email.subject.startsWith('Fwd:') 
      ? email.subject 
      : `${type === 'forward' ? 'Fwd' : 'Re'}: ${email.subject}`;

    const quoteHeader = `<br><br>On ${formatFullDate(email.createdAt)}, ${email.from.name} &lt;${email.from.email}&gt; wrote:<br>`;
    const quotedBody = `<blockquote style="margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex;">${email.body}</blockquote>`;

    const composeData = {
      to: type === 'forward' ? [] : [email.from.email],
      cc: type === 'reply-all' ? email.to.map(t => t.email).filter(e => e !== userId) : [],
      bcc: [],
      subject: replySubject,
      body: quoteHeader + quotedBody,
      replyToId: type !== 'forward' ? email.id : undefined,
      forwardFromId: type === 'forward' ? email.id : undefined,
    };

    openCompose(composeData);
  };

  const handlePrint = () => {
    window.print();
  };

  const initials = getInitials(email.from.name);
  const avatarBg = getAvatarColor(email.from.name);

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 sticky top-16 bg-background/80 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-border/40 mx-2" />

          <button
            onClick={() => handleMoveFolder('archive')}
            title="Archive"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Archive className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleMoveFolder('trash')}
            title="Delete"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleStar}
            title={email.isStarred ? 'Unstar' : 'Star'}
            className={cn(
              'p-2 text-muted-foreground hover:text-amber-500 rounded-lg hover:bg-muted/50 transition-colors',
              email.isStarred && 'text-amber-500 hover:text-amber-600'
            )}
          >
            <Star className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReply('reply')}
            title="Reply"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <CornerUpLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleReply('reply-all')}
            title="Reply All"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ReplyAll className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleReply('forward')}
            title="Forward"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <CornerUpRight className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrint}
            title="Print"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Email Body Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Subject */}
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {email.subject || '(No Subject)'}
        </h1>

        {/* Sender details */}
        <div className="flex items-start justify-between gap-4 py-2">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {email.from.name}
                <span className="text-xs font-normal text-muted-foreground">
                  &lt;{email.from.email}&gt;
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                To: {email.to.map((t) => `${t.name || t.email}`).join(', ')}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground/80">
            {formatFullDate(email.createdAt)}
          </span>
        </div>

        {/* HTML Message Body */}
        <div 
          className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm py-4 border-t border-border/20"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(email.body) }}
        />

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-6 border-t border-border/20">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
              <Paperclip className="w-4 h-4 text-primary" />
              <span>Attachments ({email.attachments.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {email.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{file.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors shrink-0"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
