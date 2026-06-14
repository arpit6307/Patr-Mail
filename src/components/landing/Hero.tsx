'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, LogIn, Sparkles, Inbox, CheckCircle2, ShieldCheck, MailOpen, HardDrive, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Indian Flag SVG Component ───────────────────────────── */
function IndianFlagIcon() {
  return (
    <svg className="w-4.5 h-3 shrink-0 rounded-sm" viewBox="0 0 3 2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="0.666" fill="#FF9933" />
      <rect y="0.666" width="3" height="0.666" fill="#FFFFFF" />
      <rect y="1.333" width="3" height="0.666" fill="#138808" />
      <circle cx="1.5" cy="1" r="0.2" fill="#000080" />
    </svg>
  );
}

/* ── 3D Interactive CSS Email mockup ─────────────────────── */
function EmailMockup() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse coordinate ratios to degrees of rotation
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);

  // Spring physics for buttery-smooth movements
  const springX = useSpring(rotateX, { damping: 25, stiffness: 220 });
  const springY = useSpring(rotateY, { damping: 25, stiffness: 220 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalized value between -0.5 and 0.5
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-full max-w-md mx-auto perspective-1000"
    >
      {/* Dynamic ambient glow behind the card */}
      <div className="absolute inset-0 bg-gradient-to-br from-patr-orange/20 via-patr-blue/10 to-patr-green/10 rounded-2xl blur-3xl scale-105 -z-10" />

      {/* 3D Container */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: 'preserve-3d',
        }}
        className="rounded-2xl border border-white/[0.08] bg-card/90 dark:bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-shadow duration-300 hover:shadow-patr-orange/10 preserve-3d"
      >
        {/* Browser title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-[10px] text-muted-foreground font-mono tracking-tight select-none">
            mail.patr.in — Inbox
          </span>
        </div>

        {/* Inbox rows */}
        <div className="divide-y divide-border/20">
          {[
            {
              from: 'Patr Team',
              subject: 'Swagat hai! Welcome to Patr',
              time: 'Just now',
              unread: true,
              icon: Sparkles,
              iconColor: 'text-patr-orange',
            },
            {
              from: 'Amit Verma',
              subject: 'Naya design proposals check karo',
              time: '5 min ago',
              unread: true,
              icon: MailOpen,
              iconColor: 'text-patr-blue',
            },
            {
              from: 'Cloud Storage',
              subject: '5GB free storage activated successfully',
              time: '1 hr ago',
              unread: false,
              icon: HardDrive,
              iconColor: 'text-patr-green',
            },
            {
              from: 'Security Shield',
              subject: '2FA authentication setup completed',
              time: 'Yesterday',
              unread: false,
              icon: ShieldCheck,
              iconColor: 'text-amber-500',
            },
          ].map((email, idx) => {
            const Icon = email.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-default',
                  email.unread && 'bg-primary/5 dark:bg-primary/[0.02]'
                )}
              >
                {/* Custom icon avatar */}
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 text-sm font-semibold border border-border/30', email.iconColor)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span
                      className={cn(
                        'text-xs truncate',
                        email.unread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                      )}
                    >
                      {email.from}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {email.time}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs truncate mt-0.5',
                      email.unread ? 'text-foreground/90 font-medium' : 'text-muted-foreground/80'
                    )}
                  >
                    {email.subject}
                  </p>
                </div>

                {email.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-patr-orange shrink-0 shadow-sm shadow-patr-orange/30 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Hero Main Component ────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax scrolling hooks
  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 600], [0, 80]);
  const mockupY = useTransform(scrollY, [0, 600], [0, -30]);
  const textOpacity = useTransform(scrollY, [0, 500], [1, 0.2]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Soft animated background blur points */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-patr-orange/15 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-patr-blue/10 blur-[130px]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ y: textY, opacity: textOpacity }}
            className="text-center lg:text-left space-y-6"
          >
            {/* Indian Flag Badge */}
            <motion.div variants={itemVariants} className="inline-flex">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-patr-orange/10 text-patr-orange border border-patr-orange/20 shadow-sm">
                <IndianFlagIcon />
                <span>Made in India</span>
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
            >
              <span className="gradient-text font-black">India ka Apna</span>
              <br />
              <span className="flex items-center justify-center lg:justify-start gap-3">
                <span>Inbox</span>
                <Inbox className="w-8 h-8 sm:w-10 sm:h-10 text-patr-orange shrink-0" />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Patr — ek <strong className="text-foreground">secure</strong>,{' '}
              <strong className="text-foreground">fast</strong>, aur{' '}
              <strong className="text-foreground">proudly Indian</strong> email
              platform. Apna digital pata banao, apni bhasha mein.
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full
                           bg-gradient-to-r from-patr-orange to-orange-600 text-white font-bold text-sm
                           shadow-lg shadow-patr-orange/25 hover:shadow-xl hover:shadow-patr-orange/30
                           hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px]"
              >
                <span>Apna ID Banao</span>
                <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full
                           border border-border/80 bg-background/50 hover:bg-muted text-foreground font-semibold text-sm
                           hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px]"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>Login Karo</span>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={itemVariants} className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="w-4 h-4 text-patr-orange animate-pulse" />
              <span>10,000+ Indians already on Patr</span>
            </motion.div>
          </motion.div>

          {/* Right Parallax Mockup */}
          <motion.div style={{ y: mockupY }} className="hidden lg:block">
            <EmailMockup />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
export { Hero };
