'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { subscribeToMailbox } from '@/lib/firebase/firestore';
import type { MailboxEntry } from '@/types/email';

export function useNotificationListener() {
  const userId = useAuthStore((s) => s.user?.uid);
  const addNotification = useNotificationStore((s) => s.addNotification);
  
  // Track the timestamp of when this listener mounted to avoid notifying on old unread emails
  const mountTimeRef = useRef<number>(Date.now());
  // Keep track of notified email IDs to prevent duplicate alerts
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    mountTimeRef.current = Date.now();

    // Subscribe to the inbox mailbox in real-time (first page, limit 5)
    const unsubscribe = subscribeToMailbox(
      userId,
      'inbox',
      null, // listen to all categories
      5,
      (emails) => {
        emails.forEach((email) => {
          // Check if email is unread
          if (email.isRead) return;

          // Convert receivedAt to milliseconds timestamp
          let receivedTime = 0;
          if (email.receivedAt) {
            if (typeof (email.receivedAt as any).seconds === 'number') {
              receivedTime = (email.receivedAt as any).seconds * 1000;
            } else {
              receivedTime = new Date(email.receivedAt as any).getTime();
            }
          }

          // Trigger alert if:
          // 1. It arrived after the listener mounted
          // 2. We haven't already notified the user for this email ID
          if (receivedTime > mountTimeRef.current && !notifiedIdsRef.current.has(email.id)) {
            notifiedIdsRef.current.add(email.id);
            addNotification(
              `Naya Patr received! ✉️`,
              `From ${email.senderName}: "${email.subject || '(No Subject)'}"`,
              'email',
              `/email/${email.emailId}`
            );
          }
        });
      }
    );

    return () => unsubscribe();
  }, [userId, addNotification]);
}
