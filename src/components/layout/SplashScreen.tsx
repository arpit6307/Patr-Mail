'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  isLoading: boolean;
}

export function SplashScreen({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(true);
  
  // Detect active theme dynamically, matching SSR and localStorage state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('patr-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark'; // Fallback for Server-side rendering
  });

  useEffect(() => {
    // Sync theme on mount
    const savedTheme = localStorage.getItem('patr-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Set up a MutationObserver to listen for html class changes (theme switches)
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    const startTime = Date.now();

    const checkLoading = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);

      if (!isLoading) {
        timerId = setTimeout(() => {
          setShow(false);
        }, remainingTime);
      }
    };

    checkLoading();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isLoading]);

  // Prevent background scrolling while the splash screen is showing
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none pointer-events-auto transition-colors duration-300",
            theme === 'dark' ? "bg-[#030014]" : "bg-[#f8fafc]"
          )}
        >
          {/* Subtle radial glow matching brand colors */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-300",
              theme === 'dark'
                ? "bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.08)_0%,transparent_60%)]"
                : "bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.04)_0%,transparent_60%)]"
            )}
          />

          {/* Logo container - Breathing/Pulse Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.95, 1.03, 0.95], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
              opacity: { duration: 0.5 }
            }}
            className={cn(
              "relative w-28 h-28 mb-6 p-1.5 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-300",
              theme === 'dark'
                ? "bg-gradient-to-tr from-[#FF6B35]/30 to-transparent border border-white/10 shadow-[0_0_40px_rgba(255,107,53,0.12)]"
                : "bg-gradient-to-tr from-[#FF6B35]/15 to-transparent border border-black/5 shadow-[0_0_40px_rgba(255,107,53,0.06)]"
            )}
          >
            <img src="/logo.png" alt="Patr Logo" className="w-20 h-20 object-contain rounded-2xl" />
          </motion.div>

          {/* Brand Heading */}
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className={cn(
              "text-3xl font-extrabold tracking-wider bg-clip-text text-transparent flex items-center gap-2 transition-all duration-300",
              theme === 'dark'
                ? "bg-gradient-to-r from-white via-slate-100 to-slate-400"
                : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-500"
            )}
          >
            <span className="text-patr-orange font-bold font-sans">पत्र</span> Workspace
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className={cn(
              "text-xs uppercase tracking-[0.25em] mt-2 font-medium transition-colors duration-300",
              theme === 'dark' ? "text-slate-400/60" : "text-slate-500/75"
            )}
          >
            India ka Apna Inbox
          </motion.p>

          {/* Indian Tricolor Sweeping Loading Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className={cn(
              "w-48 h-1 rounded-full overflow-hidden mt-8 relative transition-colors duration-300",
              theme === 'dark' ? "bg-white/5" : "bg-black/5"
            )}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]"
              animate={{
                x: ["-100%", "200%"]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut"
              }}
              style={{ width: "50%", position: "absolute", left: 0 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
