'use client';

import { useEffect, type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useUIStore } from '@/store/uiStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const setIsMobile = useUIStore((s) => s.setIsMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobile(isMobile);
      if (isMobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />

      {/* Main content area */}
      <main className="lg:ml-[260px] min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
