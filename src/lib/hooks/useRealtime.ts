'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscribeToUnreadCount } from '@/lib/firebase/realtime';

export function useRealtime() {
  const userId = useAuthStore((s) => s.user?.uid);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [userId]);

  return { unreadCount };
}
