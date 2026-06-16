'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AuthStoreProvider } from '@/store/authStore';
import { EmailStoreProvider } from '@/store/emailStore';
import { UIStoreProvider } from '@/store/uiStore';
import { NotificationStoreProvider } from '@/store/notificationStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useNotificationListener } from '@/lib/hooks/useNotificationListener';

interface ProvidersProps {
  children: ReactNode;
}

import { SplashScreen } from './SplashScreen';

function AuthGuard({ children }: { children: ReactNode }) {
  // Execute auth listening and routing redirects globally
  const { isLoading } = useAuth();
  useKeyboardShortcuts();
  useNotificationListener();
  return (
    <>
      <SplashScreen isLoading={isLoading} />
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
