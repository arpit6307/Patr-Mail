'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getEmail } from '@/lib/firebase/firestore';
import { EmailView } from '@/components/email/EmailView';
import { db } from '@/lib/firebase/config';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Email } from '@/types/email';

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.uid);
  
  const [email, setEmail] = useState<Email | null>(null);
  const [mailboxId, setMailboxId] = useState<string | null>(null);
  const [mailboxLabels, setMailboxLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailId = params.id as string;

  useEffect(() => {
    if (!userId || !emailId) return;

    const fetchEmailData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch full email content
        const emailData = await getEmail(emailId);
        if (!emailData) {
          setError('Email nahi mila. Kripya check karein.');
          setLoading(false);
          return;
        }

        // Fetch user's mailbox entry to get mailboxId (for folders, read, starred operations)
        const q = query(
          collection(db, 'users', userId, 'mailbox'),
          where('emailId', '==', emailId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('Aapko is email ko dekhne ki ijazat nahi hai.');
          setLoading(false);
          return;
        }

        setEmail(emailData);
        const mailboxDoc = snap.docs[0];
        setMailboxId(mailboxDoc.id);
        setMailboxLabels(mailboxDoc.data().labels || []);
      } catch (err) {
        console.error('Error fetching email detail:', err);
        setError('Email load karne mein dikkat aayi.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailData();
  }, [userId, emailId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-patr-orange mb-2" />
        <p className="text-sm text-muted-foreground">Patr load ho raha hai...</p>
      </div>
    );
  }

  if (error || !email || !mailboxId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-1">{error || 'Email load nahi ho saka'}</h3>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-opacity-95"
        >
          Peeche Jao
        </button>
      </div>
    );
  }

  return <EmailView email={email} mailboxId={mailboxId} initialLabels={mailboxLabels} />;
}
