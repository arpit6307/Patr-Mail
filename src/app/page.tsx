'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, HelpCircle, LogIn, Sparkles, UserPlus, Heart } from 'lucide-react';
import Link from 'next/link';
import LandingNavbar from '@/components/landing/LandingNavbar';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Security from '@/components/landing/Security';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import InteractiveParticles from '@/components/landing/InteractiveParticles';
import ScrollToTop from '@/components/landing/ScrollToTop';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#070714] overflow-hidden perspective-1000">
      {/* ── 3D Mobile Menu Panel (Renders Behind the Page) ── */}
      <div className="absolute inset-0 z-0 flex flex-col justify-between p-8 pt-24 md:hidden w-[70%] text-left">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-patr-orange">पत्र</span>
            <span className="text-xl font-bold text-white tracking-wider">Patr</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            {[
              { label: 'Features', href: '#features', icon: Compass },
              { label: 'How it works', href: '#how-it-works', icon: HelpCircle },
              { label: 'Login', href: '/login', icon: LogIn },
              { label: 'Register', href: '/register', icon: UserPlus },
            ].map((link, idx) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={menuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-4 text-lg font-bold text-slate-300 hover:text-patr-orange transition-colors group"
                  >
                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-patr-orange/30 group-hover:bg-patr-orange/10 transition-colors">
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-patr-orange transition-colors" />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Brand Tagline in Mobile Menu */}
        <div className="space-y-4">
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-patr-orange to-orange-600 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-patr-orange/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apna Patr ID Banao</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Developed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>Arpit Singh Yadav</span>
          </div>
        </div>
      </div>

      {/* ── 3D Tilting Page Content Wrapper ── */}
      <motion.div
        animate={menuOpen ? {
          scale: 0.82,
          rotateY: -16,
          x: '70%',
          z: -100,
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        } : {
          scale: 1,
          rotateY: 0,
          x: '0%',
          z: 0,
          borderRadius: '0px',
          boxShadow: 'none',
        }}
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 18,
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
        className="relative min-h-screen bg-background overflow-x-hidden z-10 origin-left"
      >
        {/* Click to Close Overlay */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 z-50 cursor-pointer bg-black/10 backdrop-blur-[2px] transition-all duration-300 rounded-[24px]"
          />
        )}

        <InteractiveParticles />
        <LandingNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <main className="pt-16 relative z-10">
          <Hero />
          <Stats />
          <Features />
          <HowItWorks />
          <Security />
          <Testimonials />
          <FAQ />
          <CTA />
        </main>
        <Footer />
        <ScrollToTop />
      </motion.div>
    </div>
  );
}
