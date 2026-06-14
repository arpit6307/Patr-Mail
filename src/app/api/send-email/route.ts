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

    // 2. Validate recipients and collect their UIDs & vacation settings
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
      recipientUids.push(recDoc.id);

      // Add to vacation responder trigger list if enabled and we are not replying to ourselves
      if (
        recData.vacationResponderEnabled && 
        recData.vacationSubject && 
        recData.vacationMessage && 
        recipient.email !== from.email
      ) {
        vacationRepliesToTrigger.push({
          recipientUid: recDoc.id,
          recipientAddress: recipient.email,
          recipientName: recData.displayName || recipient.email.split('@')[0],
          subject: recData.vacationSubject,
          message: recData.vacationMessage,
        });
      }
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

    // 6. Trigger vacation auto-replies asynchronously/sequentially
    for (const reply of vacationRepliesToTrigger) {
      try {
        const autoReplyDoc = await addDoc(collection(db, 'emails'), {
          from: { email: reply.recipientAddress, name: reply.recipientName },
          to: [{ email: from.email, name: from.name }],
          cc: [],
          subject: `Auto-Reply: ${reply.subject}`,
          body: `<div style="font-family: sans-serif; line-height: 1.5; color: #333; white-space: pre-wrap;">${reply.message}</div><br/><hr/><div style="color: #888; font-size: 11px; font-style: italic;">This is an automated vacation reply from Patr. 🇮🇳</div>`,
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
