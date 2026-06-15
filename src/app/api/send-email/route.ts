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

async function getMailboxSizeInRoute(userId: string): Promise<number> {
  try {
    const q = query(collection(db, 'users', userId, 'mailbox'));
    const snap = await getDocs(q);
    let totalSize = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      totalSize += typeof data.size === 'number' ? data.size : 2048;
    });
    return totalSize;
  } catch (error) {
    console.error('Error fetching mailbox size in route:', error);
    return 0;
  }
}

function calculateEmailSizeInRoute(subject: string, body: string, attachments: any[]): number {
  const subjectSize = subject?.length || 0;
  const bodySize = body?.length || 0;
  const attachmentsSize = attachments?.reduce((sum, att) => sum + (att.fileSize || att.size || 0), 0) || 0;
  return subjectSize + bodySize + attachmentsSize;
}

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

    // 1. Find Sender User UID in Firestore & Check Storage
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
    const senderDoc = senderSnap.docs[0];
    const senderUid = senderDoc.id;
    const senderData = senderDoc.data();
    const senderPhotoURL = senderData.photoURL || '';

    // Sender storage limit check
    const senderLimit = senderData.storageLimit ?? (5 * 1024 * 1024 * 1024); // 5GB
    const senderUsed = await getMailboxSizeInRoute(senderUid);
    if (senderUsed >= senderLimit) {
      return NextResponse.json(
        { error: 'Aapka storage full ho chuka hai. Email send karne ke liye space khali karein.' },
        { status: 400 }
      );
    }

    // 2. Validate recipients, check their storage, collect UIDs & vacation settings
    const recipientUids: string[] = [];
    const allRecipients = [...to, ...(cc || [])];
    const vacationRepliesToTrigger: { 
      recipientUid: string; 
      recipientAddress: string; 
      recipientName: string; 
      subject: string; 
      message: string; 
    }[] = [];

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
      const recDoc = recSnap.docs[0];
      const recData = recDoc.data();
      const recUid = recDoc.id;

      // Recipient storage check
      const recLimit = recData.storageLimit ?? (5 * 1024 * 1024 * 1024);
      const recUsed = await getMailboxSizeInRoute(recUid);
      if (recUsed >= recLimit) {
        return NextResponse.json(
          { error: `Recipient "${recipient.email}" ka storage full hai, new emails receive nahi ho sakte.` },
          { status: 400 }
        );
      }

      recipientUids.push(recUid);

      // Add to vacation responder trigger list if enabled and we are not replying to ourselves
      if (
        recData.vacationResponderEnabled && 
        recData.vacationSubject && 
        recData.vacationMessage && 
        recipient.email !== from.email
      ) {
        vacationRepliesToTrigger.push({
          recipientUid: recUid,
          recipientAddress: recipient.email,
          recipientName: recData.displayName || recipient.email.split('@')[0],
          subject: recData.vacationSubject,
          message: recData.vacationMessage,
        });
      }
    }

    // Calculate size of this email
    const emailSize = calculateEmailSizeInRoute(subject, emailBody, attachments || []);

    // 3. Create the master Email document in /emails
    const newEmailDoc = await addDoc(collection(db, 'emails'), {
      from: {
        ...from,
        photoURL: senderPhotoURL,
      },
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
      senderPhotoURL,
      subject,
      preview: emailBody.replace(/<[^>]*>/g, '').substring(0, 100),
      hasAttachments: (attachments || []).length > 0,
      category: 'primary',
      size: emailSize,
      receivedAt: serverTimestamp(),
    });

    // 4b. Recipients mailbox entries (folder = 'inbox', read = false)
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
        preview: emailBody.replace(/<[^>]*>/g, '').substring(0, 100),
        hasAttachments: (attachments || []).length > 0,
        category: 'primary',
        size: emailSize,
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

    // 6. Trigger vacation auto-replies asynchronously/sequentially
    for (const reply of vacationRepliesToTrigger) {
      try {
        const autoReplyBodyText = `<div style="font-family: sans-serif; line-height: 1.5; color: #333; white-space: pre-wrap;">${reply.message}</div><br/><hr/><div style="color: #888; font-size: 11px; font-style: italic;">This is an automated vacation reply from Patr. 🇮🇳</div>`;
        const autoReplySize = `Auto-Reply: ${reply.subject}`.length + autoReplyBodyText.length;

        const autoReplyDoc = await addDoc(collection(db, 'emails'), {
          from: { email: reply.recipientAddress, name: reply.recipientName },
          to: [{ email: from.email, name: from.name }],
          cc: [],
          subject: `Auto-Reply: ${reply.subject}`,
          body: autoReplyBodyText,
          attachments: [],
          isRead: false,
          isStarred: false,
          isDraft: false,
          category: 'primary',
          createdAt: serverTimestamp(),
        });

        const replyEmailId = autoReplyDoc.id;
        const autoReplyBatch = writeBatch(db);

        // Save auto-reply to vacation responder's Sent folder
        const autoReplySentRef = doc(collection(db, 'users', reply.recipientUid, 'mailbox'));
        autoReplyBatch.set(autoReplySentRef, {
          emailId: replyEmailId,
          folder: 'sent',
          isRead: true,
          isStarred: false,
          senderName: reply.recipientName,
          senderEmail: reply.recipientAddress,
          subject: `Auto-Reply: ${reply.subject}`,
          preview: reply.message.substring(0, 100),
          hasAttachments: false,
          category: 'primary',
          size: autoReplySize,
          receivedAt: serverTimestamp(),
        });

        // Save auto-reply to original sender's Inbox folder
        const autoReplyInboxRef = doc(collection(db, 'users', senderUid, 'mailbox'));
        autoReplyBatch.set(autoReplyInboxRef, {
          emailId: replyEmailId,
          folder: 'inbox',
          isRead: false,
          isStarred: false,
          senderName: reply.recipientName,
          senderEmail: reply.recipientAddress,
          subject: `Auto-Reply: ${reply.subject}`,
          preview: reply.message.substring(0, 100),
          hasAttachments: false,
          category: 'primary',
          size: autoReplySize,
          receivedAt: serverTimestamp(),
        });

        await autoReplyBatch.commit();

        // Increment unread count for the original sender
        const senderUnreadRef = ref(rtdb, `users/${senderUid}/unreadCount`);
        const snapshot = await get(senderUnreadRef);
        const current = snapshot.val() ?? 0;
        await set(senderUnreadRef, current + 1);
      } catch (err) {
        console.error(`Failed to process vacation auto-reply from ${reply.recipientAddress}:`, err);
      }
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
