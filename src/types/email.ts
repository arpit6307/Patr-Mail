import { Timestamp } from 'firebase/firestore';

// ─── Email Categories & Folders ─────────────────────────

export type EmailCategory = 'primary' | 'social' | 'promotions';

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash' | 'archive' | 'spam';

// ─── Attachment ─────────────────────────────────────────

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt?: Timestamp | Date;
}

// ─── Email (full document in /emails collection) ────────

export interface Email {
  id: string;
  from: {
    email: string;
    name: string;
    photoURL?: string;
  };
  to: { email: string; name: string }[];
  cc?: { email: string; name: string }[];
  bcc?: { email: string; name: string }[];
  subject: string;
  body: string;           // HTML body
  textBody?: string;      // plain text version
  attachments: Attachment[];
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  category: EmailCategory;
  replyToId?: string;
  forwardFromId?: string;
  threadId?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─── MailboxEntry (per-user ref in /users/{uid}/mailbox) ─

export interface MailboxEntry {
  id: string;             // mailbox document id
  emailId: string;        // ref to /emails/{id}
  folder: EmailFolder;
  isRead: boolean;
  isStarred: boolean;
  senderName: string;
  senderEmail: string;
  senderPhotoURL?: string;
  subject: string;
  preview: string;        // first ~100 chars of textBody
  hasAttachments: boolean;
  category: EmailCategory;
  receivedAt: Timestamp | Date;
  labels?: string[];
}

// ─── Compose Data ───────────────────────────────────────

export interface ComposeData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  replyToId?: string;
  forwardFromId?: string;
  draftId?: string;
}
