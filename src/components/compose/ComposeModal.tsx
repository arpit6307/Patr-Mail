'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Save, Trash2, Paperclip, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEmailStore } from '@/store/emailStore';
import { validatePatrEmail } from '@/lib/validations/email';
import { saveDraft } from '@/lib/firebase/firestore';
import { uploadAttachment } from '@/lib/firebase/storage';
import { RichEditor } from './RichEditor';
import { AttachmentUpload } from './AttachmentUpload';

export function ComposeModal() {
  const userId = useAuthStore((s) => s.user?.uid);
  const userEmail = useAuthStore((s) => s.user?.email);
  const userName = useAuthStore((s) => s.user?.displayName);
  
  const isComposing = useEmailStore((s) => s.isComposing);
  const composeData = useEmailStore((s) => s.composeData);
  const closeCompose = useEmailStore((s) => s.closeCompose);

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

  // Sync with initial composeData when compose modal is opened
  useEffect(() => {
    if (isComposing && composeData) {
      setTo(composeData.to || []);
      setCc(composeData.cc || []);
      setShowCc((composeData.cc?.length ?? 0) > 0);
      setSubject(composeData.subject || '');
      setBody(composeData.body || '');
      setDraftId(composeData.draftId);
      setFiles([]);
      setError(null);
    }
  }, [isComposing, composeData]);

  // Auto-save draft timer (30s)
  useEffect(() => {
    if (!isComposing || !userId) return;

    const interval = setInterval(async () => {
      // Don't auto-save if to, subject and body are all empty
      if (to.length === 0 && !subject && !body) return;

      try {
        const draftData = {
          from: { email: userEmail || '', name: userName || '' },
          to: to.map((email) => ({ email, name: email.split('@')[0] })),
          cc: cc.map((email) => ({ email, name: email.split('@')[0] })),
          subject: subject || '(No Subject)',
          body: body || '',
          attachments: [], // Local files aren't uploaded yet for draft
        };
        const id = await saveDraft(userId, draftData, draftId);
        setDraftId(id);
      } catch (err) {
        console.error('Auto-save draft error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isComposing, userId, to, cc, subject, body, draftId, userEmail, userName]);

  if (!isComposing) return null;

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
      // 1. Upload Attachments if any
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

      // 2. Call Send Email API
      const emailPayload = {
        from: { email: userEmail, name: userName },
        to: to.map((e) => ({ email: e, name: e.split('@')[0] })),
        cc: cc.map((e) => ({ email: e, name: e.split('@')[0] })),
        subject: subject || '(No Subject)',
        body: body || '',
        attachments: uploadedAttachments,
        draftId, // Pass draft ID to delete it after sending
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

      closeCompose();
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
      closeCompose();
    } catch (err) {
      console.error('Save draft error:', err);
      setError('Draft save nahi ho saka.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-3xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
          <h3 className="font-bold text-foreground">Naya Patr Likho</h3>
          <button
            onClick={closeCompose}
            className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* To Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To</label>
              <button
                onClick={() => setShowCc(!showCc)}
                className="text-xs text-patr-orange hover:underline"
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

          {/* CC Field */}
          {showCc && (
            <div className="space-y-1 animate-fade-in">
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

          {/* Subject Field */}
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

          {/* Body Rich Text Editor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</label>
            <RichEditor value={body} onChange={setBody} placeholder="Apna patr yahan likhein..." />
          </div>

          {/* Attachment Upload */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </label>
            <AttachmentUpload files={files} onFilesChange={setFiles} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/10 flex justify-between items-center">
          <button
            type="button"
            onClick={closeCompose}
            className="p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            disabled={loading}
            title="Discard"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted text-foreground transition-all"
              disabled={loading}
            >
              <Save className="w-4.5 h-4.5" />
              <span>Draft</span>
            </button>
            
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-patr-orange text-white font-bold text-sm hover:bg-opacity-95 shadow-md shadow-patr-orange/15 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export default ComposeModal;
