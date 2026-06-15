import { useState } from 'react';
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
  Tag,
} from 'lucide-react';
import type { Email } from '@/types/email';
import { formatFullDate, getInitials, getAvatarColor, sanitizeHTML, cn, formatFileSize } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { toggleStar, moveToFolder } from '@/lib/firebase/firestore';
import { useUserAvatar } from '@/lib/hooks/useUserAvatar';

interface EmailViewProps {
  email: Email;
  mailboxId: string; // The specific mailbox entry ID for operations
  initialLabels?: string[];
}

export function EmailView({ email, mailboxId, initialLabels = [] }: EmailViewProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const customLabels = user?.labels || [];

  const openCompose = useEmailStore((s) => s.openCompose);
  const updateEmailInList = useEmailStore((s) => s.updateEmailInList);

  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);

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

  const handleToggleLabel = async (labelName: string) => {
    if (!userId) return;

    let updatedLabels: string[];
    if (labels.includes(labelName)) {
      updatedLabels = labels.filter((l) => l !== labelName);
    } else {
      updatedLabels = [...labels, labelName];
    }

    setLabels(updatedLabels);
    try {
      const { updateMailboxEntryLabels } = await import('@/lib/firebase/firestore');
      await updateMailboxEntryLabels(userId, mailboxId, updatedLabels);
      updateEmailInList(mailboxId, { labels: updatedLabels });
    } catch (error) {
      console.error('Error toggling labels:', error);
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
  const { photoURL } = useUserAvatar(email.from.email);

  return (
    <div className="flex flex-col bg-gradient-to-br from-background via-background to-muted/30 min-h-screen print:bg-white print:min-h-0">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 sticky top-16 bg-background/40 backdrop-blur-md z-20 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-border/40 mx-2" />

          <button
            onClick={() => handleMoveFolder('archive')}
            title="Archive"
            className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <Archive className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleMoveFolder('trash')}
            title="Delete"
            className="p-2.5 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleStar}
            title={email.isStarred ? 'Unstar' : 'Star'}
            className={cn(
              'p-2.5 text-muted-foreground hover:text-amber-500 rounded-xl hover:bg-amber-500/10 transition-all duration-200 active:scale-95 hover:shadow-sm',
              email.isStarred && 'text-amber-500 hover:text-amber-600 bg-amber-500/5'
            )}
          >
            <Star className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>

          <div className="h-6 w-px bg-border/40 mx-2" />

          {/* Label dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
              title="Label As"
              className={cn(
                'p-2.5 text-muted-foreground hover:text-patr-orange rounded-xl hover:bg-patr-orange/10 transition-all duration-200 active:scale-95 hover:shadow-sm flex items-center gap-1',
                showLabelsDropdown && 'bg-patr-orange/15 text-patr-orange shadow-inner'
              )}
            >
              <Tag className="w-5 h-5" />
            </button>

            {showLabelsDropdown && (
              <div className="absolute left-0 mt-2 z-50 w-56 rounded-2xl border border-border/80 bg-card/95 p-3 backdrop-blur-xl shadow-2xl space-y-2 select-none animate-fade-in text-xs">
                <span className="font-bold text-muted-foreground/80 px-1.5 py-0.5 block uppercase tracking-wider text-[10px]">Label email as:</span>
                {customLabels.length === 0 ? (
                  <p className="text-muted-foreground px-1.5 py-2 text-[11px] font-medium leading-relaxed">Koi labels nahi bane hain. Settings tab mein naye labels banayein.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                    {customLabels.map((lbl) => {
                      const isChecked = labels.includes(lbl.name);
                      return (
                        <label
                          key={lbl.name}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/65 cursor-pointer font-semibold text-foreground transition-all active:scale-[0.98]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleLabel(lbl.name)}
                            className="w-4 h-4 rounded border-border text-patr-orange focus:ring-patr-orange cursor-pointer transition-colors"
                          />
                          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 shadow-sm', lbl.color)} />
                          <span className="truncate flex-1">{lbl.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReply('reply')}
            title="Reply"
            className="p-2.5 text-muted-foreground hover:text-patr-orange rounded-xl hover:bg-patr-orange/10 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <CornerUpLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleReply('reply-all')}
            title="Reply All"
            className="p-2.5 text-muted-foreground hover:text-patr-orange rounded-xl hover:bg-patr-orange/10 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <ReplyAll className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleReply('forward')}
            title="Forward"
            className="p-2.5 text-muted-foreground hover:text-patr-orange rounded-xl hover:bg-patr-orange/10 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <CornerUpRight className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrint}
            title="Print"
            className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all duration-200 active:scale-95 hover:shadow-sm"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Email Body Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6 print:max-w-none print:px-0 print:py-4 print:space-y-4">
        
        {/* Print Letterhead/Branding Header */}
        <div className="hidden print:flex items-center justify-between print-double-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Elegant प block emblem */}
            <div className="bg-black text-white w-9 h-9 flex items-center justify-center font-serif font-black text-xl rounded shadow-sm">
              प
            </div>
            <div>
              <span className="text-xl font-serif font-bold text-black tracking-widest block uppercase leading-none">पत्र Patr</span>
              <span className="text-[8px] font-sans font-bold tracking-widest text-neutral-500 uppercase mt-0.5 block">India ka Apna Inbox</span>
            </div>
          </div>
          <div className="text-right text-[9px] text-neutral-600 font-sans tracking-wide space-y-0.5">
            <p className="font-bold text-black uppercase">Official Email Printout</p>
            <p>REF ID: <span className="font-mono">{email.id.substring(0, 10).toUpperCase()}</span></p>
            <p>DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
          
          {/* Subject (Screen only) */}
          <div className="space-y-3 print:hidden">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight tracking-tight">
              {email.subject || '(No Subject)'}
            </h1>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-1 select-none">
                {labels.map((lbl) => {
                  const configuredLabel = customLabels.find((l) => l.name === lbl);
                  const colorClass = configuredLabel?.color || 'bg-muted';
                  return (
                    <span
                      key={lbl}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1",
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

          {/* Print-Only Document Metadata Card */}
          <div className="hidden print:block bg-neutral-50 border border-neutral-200 border-l-4 border-l-black p-5 rounded-md mb-6 relative overflow-hidden">
            {/* Verified Seal */}
            <div className="absolute right-4 top-4 border border-emerald-600 text-emerald-600 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-50/50 flex items-center gap-1">
              <span>✓ Verified Secure</span>
            </div>

            <h2 className="text-xl font-serif font-bold text-black border-b border-neutral-200 pb-3 mb-4">
              {email.subject || '(No Subject)'}
            </h2>

            <div className="space-y-2 text-xs text-black">
              <div className="flex items-start gap-1">
                <span className="font-bold w-12 shrink-0 text-neutral-500">From:</span>
                <div>
                  <span className="font-bold">{email.from.name}</span>
                  <span className="text-neutral-600 font-normal ml-1">&lt;{email.from.email}&gt;</span>
                </div>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-bold w-12 shrink-0 text-neutral-500">To:</span>
                <span className="font-medium">{email.to.map((t) => `${t.name || t.email}`).join(', ')}</span>
              </div>
              {email.cc && email.cc.length > 0 && (
                <div className="flex items-start gap-1">
                  <span className="font-bold w-12 shrink-0 text-neutral-500">Cc:</span>
                  <span className="font-medium">{email.cc.map((t) => `${t.name || t.email}`).join(', ')}</span>
                </div>
              )}
              {email.bcc && email.bcc.length > 0 && (
                <div className="flex items-start gap-1">
                  <span className="font-bold w-12 shrink-0 text-neutral-500">Bcc:</span>
                  <span className="font-medium">{email.bcc.map((t) => `${t.name || t.email}`).join(', ')}</span>
                </div>
              )}
              <div className="flex items-start gap-1">
                <span className="font-bold w-12 shrink-0 text-neutral-500">Date:</span>
                <span className="font-medium">{formatFullDate(email.createdAt)}</span>
              </div>
              {labels.length > 0 && (
                <div className="flex items-start gap-1 pt-2 border-t border-neutral-100 mt-2">
                  <span className="font-bold w-12 shrink-0 text-neutral-500">Labels:</span>
                  <span className="font-semibold text-neutral-600">{labels.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sender details (Screen only) */}
          <div className="flex items-start justify-between gap-4 py-2 border-b border-border/20 pb-4 print:hidden">
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-primary/20 overflow-hidden"
                style={{ backgroundColor: photoURL ? undefined : avatarBg }}
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={email.from.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
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
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {email.from.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    &lt;{email.from.email}&gt;
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To: {email.to.map((t) => `${t.name || t.email}`).join(', ')}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground/80">
              {formatFullDate(email.createdAt)}
            </span>
          </div>

          {/* HTML Message Body */}
          <div 
            className="email-body-content max-w-none text-foreground leading-relaxed text-sm py-4 border-t border-border/20 print:border-t-0 print:py-4 print:text-black"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(email.body) }}
          />

        {/* Attachments Section - Screen */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-6 border-t border-border/20 print:hidden">
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

        {/* Attachments Section - Print */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="hidden print:block pt-6 border-t border-neutral-300 mt-6 page-break-inside-avoid">
            <div className="text-xs font-bold text-black mb-3">
              Attachments ({email.attachments.length}):
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-800 list-disc pl-5">
              {email.attachments.map((file) => (
                <li key={file.id}>
                  <span className="font-semibold text-black">{file.fileName}</span>
                  <span className="text-neutral-500 font-normal"> ({formatFileSize(file.fileSize)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Print-Only Footer */}
        <div className="hidden print:block border-t border-neutral-300 pt-4 mt-8 text-center text-[8px] text-neutral-500 uppercase tracking-widest page-break-inside-avoid">
          PATR MAIL SECURE ARCHIVE • CONFIDENTIAL • भारत में निर्मित
        </div>
      </div>
    </div>
  );
}
