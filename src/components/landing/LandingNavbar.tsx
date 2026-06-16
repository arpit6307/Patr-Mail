'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Sparkles, Compass } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#how-it-works' },
  { label: 'Login', href: '/login' },
];

export default function LandingNavbar({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen?: boolean;
  setMenuOpen?: (open: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const isMenuOpen = menuOpen !== undefined ? menuOpen : localOpen;
  const toggleMenu = () => {
    if (setMenuOpen) {
      setMenuOpen(!menuOpen);
    } else {
      setLocalOpen(!localOpen);
    }
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
 
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <>
      {/* ── Main floating navbar container ──────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className={`mx-auto max-w-5xl w-full rounded-full border border-white/[0.08] dark:border-white/[0.05] transition-all duration-300 pointer-events-auto shadow-lg shadow-black/10 ${
            scrolled
              ? 'bg-background/70 backdrop-blur-xl border-border/50 shadow-md'
              : 'bg-background/30 backdrop-blur-md'
          }`}
        >
          <div className="px-6 sm:px-8">
            <div className="flex h-14 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-xl font-bold text-patr-orange transition-transform group-hover:scale-110">
                  पत्र
                </span>
                <span className="text-lg font-bold text-foreground tracking-tight">Patr</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                     key={link.label}
                     href={link.href}
                     prefetch={link.href.startsWith('/') ? true : undefined}
                     className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors relative group py-2"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-patr-orange transition-all group-hover:w-full" />
                  </Link>
                ))}

                <div className="h-4 w-px bg-border/40" />

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus:outline-none"
                  aria-label="Toggle theme"
                >
                  {dark ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>

                {/* CTA */}
                <Link
                  href="/register"
                  prefetch={true}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-patr-orange to-orange-600 text-white font-bold text-xs
                             hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-patr-orange/15"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apna Patr ID</span>
                </Link>
              </div>

              {/* Mobile controls */}
              <div className="flex items-center gap-2.5 md:hidden">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle theme"
                >
                  {dark ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
                
                {/* Hamburger Button */}
                <button
                  onClick={toggleMenu}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative z-50"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* ── Mobile Fullscreen Liquid Radial Morphing Portal Menu (Fallback when props not provided) ── */}
      <AnimatePresence>
        {menuOpen === undefined && localOpen && (
          <>
            {/* Backdrop Blur Lock */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/30 dark:bg-background/20 backdrop-blur-2xl md:hidden"
              onClick={() => setLocalOpen(false)}
            />

            {/* Morphing Expansion Portal */}
            <motion.div
              initial={{
                clipPath: 'circle(24px at calc(100% - 32px) 32px)',
                opacity: 0,
              }}
              animate={{
                clipPath: 'circle(120% at calc(100% - 32px) 32px)',
                opacity: 1,
              }}
              exit={{
                clipPath: 'circle(24px at calc(100% - 32px) 32px)',
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 18,
              }}
              className="fixed inset-4 z-40 md:hidden bg-card/95 border border-white/[0.08] dark:border-white/[0.05] shadow-2xl rounded-[2.5rem] p-6 flex flex-col overflow-y-auto max-h-[calc(100vh-2rem)] scrollbar-none"
            >
              {/* Menu Header (Top Space Spacer) */}
              <div className="flex justify-between items-center h-14 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-patr-orange">पत्र</span>
                  <span className="text-lg font-bold text-foreground">Menu</span>
                </div>
              </div>

              {/* Staggered Navigation Links */}
              <div className="flex flex-col gap-6 py-8 text-left">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -30, rotateX: 30 }}
                    animate={{ opacity: 1, x: 0, rotateX: 0 }}
                    transition={{
                      delay: 0.15 + idx * 0.08,
                      type: 'spring',
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    <Link
                      href={link.href}
                      prefetch={link.href.startsWith('/') ? true : undefined}
                      onClick={() => setLocalOpen(false)}
                      className="text-3xl font-black text-foreground hover:text-patr-orange transition-colors flex items-center gap-3 relative group"
                    >
                      <span>{link.label}</span>
                      <span className="w-2 h-2 rounded-full bg-patr-orange scale-0 group-hover:scale-100 transition-transform" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile CTA at Footer of Portal */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mt-auto shrink-0"
              >
                <div className="h-px bg-border/40" />
                <Link
                  href="/register"
                  prefetch={true}
                  onClick={() => setLocalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-patr-orange to-orange-600 text-white font-bold text-base text-center flex items-center justify-center gap-2 shadow-lg shadow-patr-orange/20"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Apna Patr ID Banao</span>
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
export { LandingNavbar };
