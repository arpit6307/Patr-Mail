'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { validatePatrEmail } from '@/lib/validations/email';
import { saveDraft } from '@/lib/firebase/firestore';
import { uploadAttachment } from '@/lib/firebase/storage';
import { RichEditor } from '@/components/compose/RichEditor';
import { AttachmentUpload } from '@/components/compose/AttachmentUpload';
import { Send, Save, ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';

export default function ComposePage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.uid);
  const userEmail = useAuthStore((s) => s.user?.email);
  const userName = useAuthStore((s) => s.user?.displayName);

  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save draft timer (30s)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      if (to.length === 0 && !subject && !body) return;

      try {
        const draftData = {
          from: { email: userEmail || '', name: userName || '' },
          to: to.map((email) => ({ email, name: email.split('@')[0] })),
          cc: cc.map((email) => ({ email, name: email.split('@')[0] })),
          subject: subject || '(No Subject)',
          body: body || '',
          attachments: [],
        };
        const id = await saveDraft(userId, draftData, draftId);
        setDraftId(id);
      } catch (err) {
        console.error('Auto-save draft error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, to, cc, subject, body, draftId, userEmail, userName]);

  const handleAddToChip = (e: React.KeyboardEvent<HTMLInputElement>, field: 'to' | 'cc') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = field === 'to' ? toInput.trim() : ccInput.trim();
      if (!val) return;

      if (!validatePatrEmail(val)) {
        setError('Sirf @patr.in email IDs hi supported hain.');
        return;
      }

      setError(null);
      if (field === 'to') {
        if (!to.includes(val)) setTo([...to, val]);
        setToInput('');
      } else {
        if (!cc.includes(val)) setCc([...cc, val]);
        setCcInput('');
      }
    }
  };

  const removeChip = (email: string, field: 'to' | 'cc') => {
    if (field === 'to') {
      setTo(to.filter((t) => t !== email));
    } else {
      setCc(cc.filter((c) => c !== email));
    }
  };

  const handleSend = async () => {
    if (to.length === 0) {
      setError('Kripya kam se kam ek recipient (To) enter karein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedAttachments = [];
      for (const file of files) {
        const url = await uploadAttachment(userId!, file);
        uploadedAttachments.push({
          id: Math.random().toString(36).substring(7),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          url,
        });
      }

      const emailPayload = {
        from: { email: userEmail, name: userName },
        to: to.map((e) => ({ email: e, name: e.split('@')[0] })),
        cc: cc.map((e) => ({ email: e, name: e.split('@')[0] })),
        subject: subject || '(No Subject)',
        body: body || '',
        attachments: uploadedAttachments,
        draftId,
      };

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Email bhejne mein dikkat aayi.');
      }

      router.push('/inbox');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const draftData = {
        from: { email: userEmail || '', name: userName || '' },
        to: to.map((email) => ({ email, name: email.split('@')[0] })),
        cc: cc.map((email) => ({ email, name: email.split('@')[0] })),
        subject: subject || '(No Subject)',
        body: body || '',
        attachments: [],
      };
      await saveDraft(userId, draftData, draftId);
      router.push('/inbox');
    } catch (err) {
      console.error('Save draft error:', err);
      setError('Draft save nahi ho saka.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Mobile-friendly Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/50 backdrop-blur sticky top-16 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-foreground text-sm">Compose</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="Save Draft"
            disabled={loading}
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="p-2 text-patr-orange hover:text-opacity-80 rounded-lg transition-colors disabled:opacity-50"
            title="Send Email"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Compose Form */}
      <div className="p-6 max-w-2xl mx-auto w-full space-y-4 flex-1 pb-24">
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* To */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To</label>
            <button
              onClick={() => setShowCc(!showCc)}
              className="text-xs text-patr-orange hover:underline font-semibold"
            >
              {showCc ? 'Hide CC' : 'Add CC'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 p-2 border border-border/60 rounded-xl bg-background items-center">
            {to.map((email) => (
              <div
                key={email}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
              >
                <span>{email}</span>
                <button type="button" onClick={() => removeChip(email, 'to')}>
                  <X className="w-3 h-3 hover:text-red-500" />
                </button>
              </div>
            ))}
            <input
              type="text"
              placeholder={to.length === 0 ? "example@patr.in" : ""}
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={(e) => handleAddToChip(e, 'to')}
              className="flex-1 bg-transparent text-sm border-none outline-none focus:ring-0 p-1 min-w-[120px]"
              disabled={loading}
            />
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CC</label>
            <div className="flex flex-wrap gap-2 p-2 border border-border/60 rounded-xl bg-background items-center">
              {cc.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-semibold"
                >
                  <span>{email}</span>
                  <button type="button" onClick={() => removeChip(email, 'cc')}>
                    <X className="w-3 h-3 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder={cc.length === 0 ? "cc@patr.in" : ""}
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) => handleAddToChip(e, 'cc')}
                className="flex-1 bg-transparent text-sm border-none outline-none focus:ring-0 p-1 min-w-[120px]"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject</label>
          <input
            type="text"
            placeholder="Patr ka subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-border/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
            disabled={loading}
          />
        </div>

        {/* Editor */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</label>
          <RichEditor value={body} onChange={setBody} placeholder="Apna patr yahan likhein..." />
        </div>

        {/* Attachments */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Paperclip Attachments
          </label>
          <AttachmentUpload files={files} onFilesChange={setFiles} />
        </div>
      </div>
    </div>
  );
}
