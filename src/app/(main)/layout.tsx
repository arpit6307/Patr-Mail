'use client';

import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { ComposeModal } from '@/components/compose/ComposeModal';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-patr-orange mb-3" />
        <p className="text-sm font-semibold tracking-wider opacity-60">Checking auth state...</p>
      </div>
    );
  }

  // If not authenticated, the global AuthGuard will handle client redirect to /login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      {children}
      <ComposeModal />
    </AppShell>
  );
}
