import { NextResponse, type NextRequest } from 'next/server';
import { db, rtdb } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { ref, get, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, cc, subject, body: emailBody, attachments, draftId } = body;

    if (!from || !to || to.length === 0) {
      return NextResponse.json(
        { error: 'Sender and at least one recipient are required.' },
        { status: 400 }
      );
    }

    // 1. Find Sender User UID in Firestore
    const senderQ = query(
      collection(db, 'users'),
      where('patrAddress', '==', from.email),
      limit(1)
    );
    const senderSnap = await getDocs(senderQ);
    if (senderSnap.empty) {
      return NextResponse.json(
        { error: `Sender account "${from.email}" not found in system.` },
        { status: 400 }
      );
    }
    const senderUid = senderSnap.docs[0].id;

    // 2. Validate recipients and collect their UIDs
    const recipientUids: string[] = [];
    const allRecipients = [...to, ...(cc || [])];

    for (const recipient of allRecipients) {
      const recQ = query(
        collection(db, 'users'),
        where('patrAddress', '==', recipient.email),
        limit(1)
      );
      const recSnap = await getDocs(recQ);
      if (recSnap.empty) {
        return NextResponse.json(
          { error: `Recipient "${recipient.email}" does not exist on Patr.` },
          { status: 400 }
        );
      }
      recipientUids.push(recSnap.docs[0].id);
    }

    // 3. Create the master Email document in /emails
    const newEmailDoc = await addDoc(collection(db, 'emails'), {
      from,
      to,
      cc: cc || [],
      subject,
      body: emailBody,
      attachments: attachments || [],
      isRead: false,
      isStarred: false,
      isDraft: false,
      category: 'primary', // default
      createdAt: serverTimestamp(),
    });

    const emailId = newEmailDoc.id;

    // 4. Batch write Mailbox entries for sender and recipients
    const batch = writeBatch(db);

    // 4a. Sender mailbox entry (folder = 'sent', read = true)
    const senderMailboxRef = doc(collection(db, 'users', senderUid, 'mailbox'));
    batch.set(senderMailboxRef, {
      emailId,
      folder: 'sent',
      isRead: true,
      isStarred: false,
      senderName: from.name,
      senderEmail: from.email,
      subject,
      preview: emailBody.replace(/<[^>]*>/g, '').substring(0, 100),
      hasAttachments: (attachments || []).length > 0,
      category: 'primary',
      receivedAt: serverTimestamp(),
    });

    // 4b. Recipients mailbox entries (folder = 'inbox', read = false)
    recipientUids.forEach((uid, idx) => {
      const recMailboxRef = doc(collection(db, 'users', uid, 'mailbox'));
      batch.set(recMailboxRef, {
        emailId,
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        senderName: from.name,
        senderEmail: from.email,
        subject,
        preview: emailBody.replace(/<[^>]*>/g, '').substring(0, 100),
        hasAttachments: (attachments || []).length > 0,
        category: 'primary',
        receivedAt: serverTimestamp(),
      });
    });

    // 4c. If sending a draft, delete the old draft document and mailbox entry
    if (draftId) {
      // Delete draft email doc
      const draftEmailRef = doc(db, 'emails', draftId);
      batch.delete(draftEmailRef);

      // Find and delete the mailbox entry for draft under sender
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

    // 5. Update unread counts in Realtime Database for all recipients
    for (const uid of recipientUids) {
      const unreadRef = ref(rtdb, `users/${uid}/unreadCount`);
      const snapshot = await get(unreadRef);
      const current = snapshot.val() ?? 0;
      await set(unreadRef, current + 1);
    }

    return NextResponse.json({ success: true, emailId });
  } catch (error: any) {
    console.error('Send email route error:', error);
    return NextResponse.json(
      { error: error.message || 'Email send failed.' },
      { status: 500 }
    );
  }
}
