import { rtdb } from '@/lib/firebase/config';
import { ref, onValue, set, increment, get } from 'firebase/database';

// ─── Subscribe to unread count ──────────────────────────

export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
) {
  const unreadRef = ref(rtdb, `users/${userId}/unreadCount`);
  return onValue(unreadRef, (snapshot) => {
    callback(snapshot.val() ?? 0);
  });
}

// ─── Update unread count ────────────────────────────────

export async function incrementUnreadCount(userId: string, amount: number = 1) {
  const unreadRef = ref(rtdb, `users/${userId}/unreadCount`);
  const snap = await get(unreadRef);
  const current = snap.val() ?? 0;
  await set(unreadRef, Math.max(0, current + amount));
}

export async function decrementUnreadCount(userId: string, amount: number = 1) {
  const unreadRef = ref(rtdb, `users/${userId}/unreadCount`);
  const snap = await get(unreadRef);
  const current = snap.val() ?? 0;
  await set(unreadRef, Math.max(0, current - amount));
}

export async function setUnreadCount(userId: string, count: number) {
  const unreadRef = ref(rtdb, `users/${userId}/unreadCount`);
  await set(unreadRef, Math.max(0, count));
}
