import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import type { User } from '@/types/user';
import type { Email, MailboxEntry, EmailFolder, EmailCategory } from '@/types/email';

// ─── Get single email ───────────────────────────────────

export async function getEmail(emailId: string): Promise<Email | null> {
  try {
    const docRef = doc(db, 'emails', emailId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Email;
  } catch (error) {
    console.error('Error fetching email:', error);
    return null;
  }
}

// ─── Subscribe to mailbox ───────────────────────────────

export function subscribeToMailbox(
  userId: string,
  folder: EmailFolder,
  category: EmailCategory | null,
  pageSize: number,
  callback: (emails: MailboxEntry[], hasMore: boolean) => void,
  lastDoc?: DocumentSnapshot
) {
  const constraints: QueryConstraint[] = [
    where('folder', '==', folder),
    orderBy('receivedAt', 'desc'),
    limit(pageSize + 1),
  ];

  if (category && folder === 'inbox') {
    constraints.splice(1, 0, where('category', '==', category));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, 'users', userId, 'mailbox'), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const emails: MailboxEntry[] = [];
    snapshot.docs.slice(0, pageSize).forEach((doc) => {
      emails.push({ id: doc.id, ...doc.data() } as MailboxEntry);
    });
    const hasMore = snapshot.docs.length > pageSize;
    callback(emails, hasMore);
  });
}

// ─── Toggle star ────────────────────────────────────────

export async function toggleStar(userId: string, mailboxId: string, emailId: string, isStarred: boolean) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', userId, 'mailbox', mailboxId), { isStarred });
  batch.update(doc(db, 'emails', emailId), { isStarred });
  await batch.commit();
}

// ─── Mark as read ───────────────────────────────────────

export async function markAsRead(userId: string, mailboxId: string, emailId: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', userId, 'mailbox', mailboxId), { isRead: true });
  batch.update(doc(db, 'emails', emailId), { isRead: true });
  await batch.commit();
}

// ─── Move to folder (archive, trash) ────────────────────

export async function moveToFolder(userId: string, mailboxId: string, folder: EmailFolder) {
  await updateDoc(doc(db, 'users', userId, 'mailbox', mailboxId), { folder });
}

// ─── Delete email ───────────────────────────────────────

export async function deleteMailboxEntry(userId: string, mailboxId: string) {
  await deleteDoc(doc(db, 'users', userId, 'mailbox', mailboxId));
}

// ─── Bulk operations ────────────────────────────────────

export async function bulkMoveToFolder(userId: string, entries: { mailboxId: string }[], folder: EmailFolder) {
  const batch = writeBatch(db);
  entries.forEach(({ mailboxId }) => {
    batch.update(doc(db, 'users', userId, 'mailbox', mailboxId), { folder });
  });
  await batch.commit();
}

export async function bulkMarkRead(userId: string, entries: { mailboxId: string; emailId: string }[]) {
  const batch = writeBatch(db);
  entries.forEach(({ mailboxId, emailId }) => {
    batch.update(doc(db, 'users', userId, 'mailbox', mailboxId), { isRead: true });
    batch.update(doc(db, 'emails', emailId), { isRead: true });
  });
  await batch.commit();
}

// ─── Save draft ─────────────────────────────────────────

export async function saveDraft(userId: string, data: Partial<Email>, draftId?: string) {
  const emailData = {
    ...data,
    isDraft: true,
    updatedAt: serverTimestamp(),
  };

  if (draftId) {
    await updateDoc(doc(db, 'emails', draftId), emailData);
    return draftId;
  } else {
    const emailDoc = await addDoc(collection(db, 'emails'), {
      ...emailData,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'users', userId, 'mailbox'), {
      emailId: emailDoc.id,
      folder: 'drafts' as EmailFolder,
      isRead: true,
      isStarred: false,
      senderName: data.from?.name || '',
      senderEmail: data.from?.email || '',
      subject: data.subject || '(No Subject)',
      preview: data.textBody?.substring(0, 100) || '',
      hasAttachments: (data.attachments?.length ?? 0) > 0,
      category: 'primary' as EmailCategory,
      receivedAt: serverTimestamp(),
    });

    return emailDoc.id;
  }
}

// ─── Check if user exists ───────────────────────────────

export async function userExistsByEmail(email: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('patrAddress', '==', email), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getUserByPatrAddress(email: string) {
  const q = query(collection(db, 'users'), where('patrAddress', '==', email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function createUserDoc(userId: string, data: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function updateUserDoc(userId: string, data: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

