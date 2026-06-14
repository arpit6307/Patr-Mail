'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useUIStore } from '@/store/uiStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const setTheme = useUIStore((s) => s.setTheme);
  const setDensity = useUIStore((s) => s.setDensity);
  const setKeyboardShortcuts = useUIStore((s) => s.setKeyboardShortcuts);

  useEffect(() => {
    setMounted(true);
    
    // Theme
    const savedTheme = localStorage.getItem('patr-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Density
    const savedDensity = localStorage.getItem('patr-density') as any;
    if (savedDensity) {
      setDensity(savedDensity);
    }

    // Shortcuts
    const savedShortcuts = localStorage.getItem('patr-shortcuts') === 'true';
    setKeyboardShortcuts(savedShortcuts);
  }, [setTheme, setDensity, setKeyboardShortcuts]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
