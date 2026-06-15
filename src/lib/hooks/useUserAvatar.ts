import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Global cache for resolved photoURLs
const avatarCache: Record<string, string> = {};
// Global cache for active promises to prevent duplicate simultaneous reads
const activePromises: Record<string, Promise<string> | undefined> = {};

async function fetchUserPhotoURL(emailAddress: string): Promise<string> {
  if (avatarCache[emailAddress] !== undefined) {
    return avatarCache[emailAddress];
  }

  const activePromise = activePromises[emailAddress];
  if (activePromise) {
    return activePromise;
  }

  const promise = (async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('patrAddress', '==', emailAddress),
        limit(1)
      );
      const snap = await getDocs(q);
      let url = '';
      if (!snap.empty) {
        url = snap.docs[0].data().photoURL || '';
      }
      avatarCache[emailAddress] = url;
      return url;
    } catch (err) {
      console.error('Error fetching user avatar:', err);
      return '';
    } finally {
      delete activePromises[emailAddress];
    }
  })();

  activePromises[emailAddress] = promise;
  return promise;
}

export function useUserAvatar(emailAddress: string) {
  const [photoURL, setPhotoURL] = useState<string | null>(
    avatarCache[emailAddress] !== undefined ? avatarCache[emailAddress] : null
  );
  const [loading, setLoading] = useState(avatarCache[emailAddress] === undefined);

  useEffect(() => {
    if (!emailAddress) {
      setPhotoURL('');
      setLoading(false);
      return;
    }

    if (avatarCache[emailAddress] !== undefined) {
      setPhotoURL(avatarCache[emailAddress]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchUserPhotoURL(emailAddress).then((url) => {
      if (isMounted) {
        setPhotoURL(url);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [emailAddress]);

  return { photoURL, loading };
}
