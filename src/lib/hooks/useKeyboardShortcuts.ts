'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useEmailStore } from '@/store/emailStore';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const keyboardShortcuts = useUIStore((s) => s.keyboardShortcuts);
  const openCompose = useEmailStore((s) => s.openCompose);
  
  // Track sequential keys (like 'g' then 'i')
  const lastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Skip if user is typing in an input, textarea, or editor
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName) {
        const tag = activeEl.tagName.toLowerCase();
        const isEditable = activeEl.hasAttribute('contenteditable') || 
                           activeEl.getAttribute('contenteditable') === 'true' ||
                           activeEl.getAttribute('role') === 'textbox';
        if (tag === 'input' || tag === 'textarea' || isEditable) {
          return;
        }
      }

      if (!e.key) return;
      const key = e.key.toLowerCase();

      // Clear 'g' sequence timer if active
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 2. Handle single key shortcuts
      if (key === 'c') {
        e.preventDefault();
        openCompose();
        lastKeyRef.current = null;
        return;
      }

      // 3. Handle sequential keys starting with 'g'
      if (lastKeyRef.current === 'g') {
        lastKeyRef.current = null; // Reset
        
        if (key === 'i') {
          e.preventDefault();
          router.push('/inbox');
        } else if (key === 's') {
          e.preventDefault();
          router.push('/sent');
        } else if (key === 'd') {
          e.preventDefault();
          router.push('/drafts');
        } else if (key === 't') {
          e.preventDefault();
          router.push('/starred');
        } else if (key === 'a') {
          e.preventDefault();
          router.push('/archive');
        } else if (key === 'r') {
          e.preventDefault();
          router.push('/trash');
        } else if (key === 'p') {
          e.preventDefault();
          router.push('/spam');
        }
        return;
      }

      // Set key sequence starter
      if (key === 'g') {
        lastKeyRef.current = 'g';
        // Reset sequence if next key isn't pressed within 1 second
        timerRef.current = setTimeout(() => {
          lastKeyRef.current = null;
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [keyboardShortcuts, openCompose, router]);
}
