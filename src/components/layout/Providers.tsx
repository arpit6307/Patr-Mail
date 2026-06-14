'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AuthStoreProvider } from '@/store/authStore';
import { EmailStoreProvider } from '@/store/emailStore';
import { UIStoreProvider } from '@/store/uiStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProvidersProps {
  children: ReactNode;
}

function AuthGuard({ children }: { children: ReactNode }) {
  // Execute auth listening and routing redirects globally
  useAuth();
  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UIStoreProvider>
      <AuthStoreProvider>
        <EmailStoreProvider>
          <ThemeProvider>
            <AuthGuard>{children}</AuthGuard>
          </ThemeProvider>
        </EmailStoreProvider>
      </AuthStoreProvider>
    </UIStoreProvider>
  );
}
