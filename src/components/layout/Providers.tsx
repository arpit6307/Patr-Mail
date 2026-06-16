'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from './ThemeProvider';
import { AuthStoreProvider } from '@/store/authStore';
import { EmailStoreProvider } from '@/store/emailStore';
import { UIStoreProvider } from '@/store/uiStore';
import { NotificationStoreProvider } from '@/store/notificationStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useNotificationListener } from '@/lib/hooks/useNotificationListener';
import { SplashScreen } from './SplashScreen';

interface ProvidersProps {
  children: ReactNode;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading: authLoading } = useAuth();
  const [navLoading, setNavLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Hide loading screen whenever the route pathname changes (transition complete)
    setNavLoading(false);
  }, [pathname]);

  useEffect(() => {
    // 1. Intercept link clicks globally for immediate visual feedback
    const handleAnchorClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target && target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          target.getAttribute('target') !== '_blank' &&
          !e.defaultPrevented &&
          e.button === 0 &&
          !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
        ) {
          try {
            const targetPathname = new URL(href, window.location.origin).pathname;
            if (targetPathname !== window.location.pathname) {
              setNavLoading(true);
            }
          } catch (err) {
            console.error('Error parsing navigation URL:', err);
          }
        }
      }
    };

    // 2. Intercept History API calls for programmatic router.push/replace actions
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const handleNavigation = (url?: string | URL | null) => {
      if (!url) return;
      try {
        const targetPathname = new URL(url.toString(), window.location.origin).pathname;
        if (targetPathname !== window.location.pathname) {
          setNavLoading(true);
        }
      } catch (err) {
        console.error('Error parsing history URL:', err);
      }
    };

    window.history.pushState = function (state: any, title: string, url?: string | URL | null) {
      handleNavigation(url);
      return originalPushState.call(window.history, state, title, url);
    };

    window.history.replaceState = function (state: any, title: string, url?: string | URL | null) {
      handleNavigation(url);
      return originalReplaceState.call(window.history, state, title, url);
    };

    // 3. Listen to browser Back/Forward navigation
    const handlePopState = () => {
      setNavLoading(true);
    };
    window.addEventListener('popstate', handlePopState);

    document.addEventListener('click', handleAnchorClick);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  useKeyboardShortcuts();
  useNotificationListener();

  return (
    <>
      <SplashScreen isLoading={authLoading || navLoading} />
      {children}
    </>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UIStoreProvider>
      <AuthStoreProvider>
        <EmailStoreProvider>
          <NotificationStoreProvider>
            <ThemeProvider>
              <AuthGuard>{children}</AuthGuard>
            </ThemeProvider>
          </NotificationStoreProvider>
        </EmailStoreProvider>
      </AuthStoreProvider>
    </UIStoreProvider>
  );
}
