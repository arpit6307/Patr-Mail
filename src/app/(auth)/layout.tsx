'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-patr-dark">
      {/* ── Animated gradient background ─────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient orbs */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-patr-orange/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-patr-blue/20 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-patr-green/10 blur-[150px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4 sm:mx-auto"
      >
        {/* ── Brand header ──────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-8 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-patr-orange shadow-lg shadow-patr-orange/30 transition-transform group-hover:scale-105">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Patr{' '}
              <span className="text-patr-orange/70 font-normal text-lg">
                पत्र
              </span>
            </h1>
            <p className="text-xs text-white/40 -mt-0.5 tracking-wide">
              Apna Email, Apni Bhasha
            </p>
          </div>
        </Link>

        {/* ── Glassmorphism card ─────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/40">
          <div className="p-6 sm:p-8">{children}</div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Patr (पत्र) · Made with ❤️ in India
        </p>
      </motion.div>
    </div>
  );
}
