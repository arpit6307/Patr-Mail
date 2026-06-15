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
// ─── Storage helpers ────────────────────────────────────

export function calculateEmailSize(email: Partial<Email>): number {
  const subjectSize = email.subject?.length || 0;
  const bodySize = email.body?.length || 0;
  const attachmentsSize = email.attachments?.reduce((sum, att) => sum + (att.fileSize || 0), 0) || 0;
  return subjectSize + bodySize + attachmentsSize;
}

export async function getUserMailboxSize(userId: string): Promise<number> {
  try {
    const q = query(collection(db, 'users', userId, 'mailbox'));
    const snap = await getDocs(q);
    let totalSize = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      // Estimate 2KB if size is not set (e.g. for existing items before this feature)
      totalSize += typeof data.size === 'number' ? data.size : 2048;
    });
    return totalSize;
  } catch (error) {
    console.error('Error fetching user mailbox size:', error);
    return 0;
  }
}

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
  let senderPhotoURL = '';
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      senderPhotoURL = userDoc.data().photoURL || '';
    }
  } catch (err) {
    console.error('Error fetching user photoURL for draft:', err);
  }

  const emailData = {
    ...data,
    from: data.from ? { ...data.from, photoURL: senderPhotoURL } : undefined,
    isDraft: true,
    updatedAt: serverTimestamp(),
  };

  const emailSize = calculateEmailSize(data);

  if (draftId) {
    await updateDoc(doc(db, 'emails', draftId), emailData);
    
    // Also update mailbox entry to keep size and preview synced
    const mailboxQ = query(
      collection(db, 'users', userId, 'mailbox'),
      where('emailId', '==', draftId),
      limit(1)
    );
    const snap = await getDocs(mailboxQ);
    if (!snap.empty) {
      const entryId = snap.docs[0].id;
      await updateDoc(doc(db, 'users', userId, 'mailbox', entryId), {
        subject: data.subject || '(No Subject)',
        preview: data.body?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
        hasAttachments: (data.attachments?.length ?? 0) > 0,
        size: emailSize,
        receivedAt: serverTimestamp(),
      });
    }
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
      senderPhotoURL,
      subject: data.subject || '(No Subject)',
      preview: data.body?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
      hasAttachments: (data.attachments?.length ?? 0) > 0,
      category: 'primary' as EmailCategory,
      size: emailSize,
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

export async function userExistsByPhone(phone: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('phoneNumber', '==', phone), limit(1));
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

export async function updateMailboxEntryLabels(userId: string, mailboxId: string, labels: string[]) {
  const mailboxRef = doc(db, 'users', userId, 'mailbox', mailboxId);
  await updateDoc(mailboxRef, { labels });
}

// ─── Send email (client-side) ───────────────────────────

export async function sendEmail(
  senderUid: string,
  data: {
    from: { email: string; name: string };
    to: { email: string; name: string }[];
    cc?: { email: string; name: string }[];
    subject: string;
    body: string;
    attachments?: any[];
    draftId?: string;
  }
) {
  const { from, to, cc, subject, body, attachments, draftId } = data;

  // 1. Storage check for sender
  const senderDocRef = doc(db, 'users', senderUid);
  const senderDocSnap = await getDoc(senderDocRef);
  let senderPhotoURL = '';
  if (senderDocSnap.exists()) {
    const senderData = senderDocSnap.data();
    senderPhotoURL = senderData.photoURL || '';
    const limitVal = senderData.storageLimit ?? (5 * 1024 * 1024 * 1024); // 5GB default
    const currentSize = await getUserMailboxSize(senderUid);
    if (currentSize >= limitVal) {
      throw new Error('Aapka storage full ho chuka hai. Email send karne ke liye space khali karein.');
    }
  }

  // 2. Validate recipients exist & check their storage limits
  const recipientUids: string[] = [];
  const allRecipients = [...to, ...(cc || [])];

  for (const recipient of allRecipients) {
    const q = query(
      collection(db, 'users'),
      where('patrAddress', '==', recipient.email),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error(`Recipient "${recipient.email}" does not exist on Patr.`);
    }
    const recDoc = snap.docs[0];
    const recUid = recDoc.id;
    const recData = recDoc.data();
    
    // Check recipient limit
    const recLimitVal = recData.storageLimit ?? (5 * 1024 * 1024 * 1024);
    const recCurrentSize = await getUserMailboxSize(recUid);
    if (recCurrentSize >= recLimitVal) {
      throw new Error(`Recipient "${recipient.email}" ka storage full hai, new emails receive nahi ho sakte.`);
    }
    
    recipientUids.push(recUid);
  }

  // Calculate size of this email
  const emailSize = calculateEmailSize({ subject, body, attachments });

  // Create master email document
  const emailDoc = await addDoc(collection(db, 'emails'), {
    from: {
      ...from,
      photoURL: senderPhotoURL,
    },
    to,
    cc: cc || [],
    subject,
    body,
    attachments: attachments || [],
    isRead: false,
    isStarred: false,
    isDraft: false,
    category: 'primary',
    createdAt: serverTimestamp(),
  });

  const emailId = emailDoc.id;

  // Batch write mailbox entries
  const batch = writeBatch(db);

  // Sender mailbox (sent folder)
  const senderMailboxRef = doc(collection(db, 'users', senderUid, 'mailbox'));
  batch.set(senderMailboxRef, {
    emailId,
    folder: 'sent',
    isRead: true,
    isStarred: false,
    senderName: from.name,
    senderEmail: from.email,
    senderPhotoURL,
    subject,
    preview: body.replace(/<[^>]*>/g, '').substring(0, 100),
    hasAttachments: (attachments || []).length > 0,
    category: 'primary',
    size: emailSize,
    receivedAt: serverTimestamp(),
  });

  // Recipients mailbox (inbox folder)
  recipientUids.forEach((uid) => {
    const recMailboxRef = doc(collection(db, 'users', uid, 'mailbox'));
    batch.set(recMailboxRef, {
      emailId,
      folder: 'inbox',
      isRead: false,
      isStarred: false,
      senderName: from.name,
      senderEmail: from.email,
      senderPhotoURL,
      subject,
      preview: body.replace(/<[^>]*>/g, '').substring(0, 100),
      hasAttachments: (attachments || []).length > 0,
      category: 'primary',
      size: emailSize,
      receivedAt: serverTimestamp(),
    });
  });

  // Delete draft if exists
  if (draftId) {
    batch.delete(doc(db, 'emails', draftId));
    
    // Find and delete draft mailbox entry
    const draftMailboxQ = query(
      collection(db, 'users', senderUid, 'mailbox'),
      where('emailId', '==', draftId),
      limit(1)
    );
    const draftMailboxSnap = await getDocs(draftMailboxQ);
    if (!draftMailboxSnap.empty) {
      batch.delete(doc(db, 'users', senderUid, 'mailbox', draftMailboxSnap.docs[0].id));
    }
  }

  await batch.commit();

  return emailId;
}

export function subscribeToAllMailbox(
  userId: string,
  pageSize: number,
  callback: (emails: MailboxEntry[]) => void
) {
  const q = query(
    collection(db, 'users', userId, 'mailbox'),
    orderBy('receivedAt', 'desc'),
    limit(pageSize)
  );

  return onSnapshot(q, (snapshot) => {
    const emails: MailboxEntry[] = [];
    snapshot.docs.forEach((doc) => {
      emails.push({ id: doc.id, ...doc.data() } as MailboxEntry);
    });
    callback(emails);
  });
}


