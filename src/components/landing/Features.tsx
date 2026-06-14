'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Zap,
  Flag,
  ShieldCheck,
  Tags,
  Share2,
  Palette,
  Compass,
  Server,
  Lock,
  Layout,
  HardDrive,
  MailOpen,
  Orbit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  id: number;
  icon: any;
  title: string;
  description: string;
  detailText: string;
  gradient: string;
  mockComponent: React.ComponentType;
}

/* ── Speed Mockup ────────────────────────────────────────── */
function SpeedMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-patr-orange/30 animate-spin" />
        <Zap className="w-10 h-10 text-patr-orange animate-pulse" />
      </div>
      <div className="font-mono text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
        <span>Load time: </span>
        <span className="text-emerald-500 font-bold">140ms</span>
      </div>
    </div>
  );
}

/* ── India Mockup ────────────────────────────────────────── */
function IndiaMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
      <Server className="w-12 h-12 text-patr-green" />
      <p className="text-sm font-bold text-foreground">Local Indian Data Centers</p>
      <span className="text-[10px] font-mono text-muted-foreground">Region: ap-south-1 (Mumbai)</span>
    </div>
  );
}

/* ── Security Mockup ─────────────────────────────────────── */
function SecurityMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
      <div className="relative">
        <Lock className="w-12 h-12 text-emerald-500" />
        <ShieldCheck className="w-6 h-6 text-primary absolute -bottom-1 -right-1" />
      </div>
      <p className="text-sm font-bold text-foreground">Double Authentication (OTP)</p>
      <span className="text-[10px] font-mono text-muted-foreground">AES-256 Bit Encryption</span>
    </div>
  );
}

/* ── Smart Labels Mockup ─────────────────────────────────── */
function SmartLabelsMockup() {
  return (
    <div className="w-full flex flex-col gap-2 p-4">
      {[
        { tag: 'Primary', desc: 'Personal Patr', color: 'bg-patr-orange/10 text-patr-orange border-patr-orange/20' },
        { tag: 'Social', desc: 'Updates from friends', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        { tag: 'Promotions', desc: 'Offers & deals', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      ].map((item, idx) => (
        <div key={idx} className={cn('flex items-center justify-between p-2 rounded-lg border text-xs', item.color)}>
          <span className="font-bold">{item.tag}</span>
          <span className="opacity-70">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

/* ── File Sharing Mockup ─────────────────────────────────── */
function FileSharingMockup() {
  return (
    <div className="flex flex-col justify-center h-full p-6 space-y-3">
      <div className="flex items-center justify-between text-xs text-foreground font-semibold">
        <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-patr-orange" /> file.zip</span>
        <span>78%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-[78%] bg-patr-orange rounded-full" />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">5GB Free Attachment Storage Enabled</p>
    </div>
  );
}

/* ── Design Mockup ───────────────────────────────────────── */
function DesignMockup() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
      <Layout className="w-12 h-12 text-pink-500" />
      <p className="text-sm font-bold text-foreground">Glassmorphism UI</p>
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-patr-orange" />
        <span className="w-3 h-3 rounded-full bg-patr-blue" />
        <span className="w-3 h-3 rounded-full bg-patr-green" />
      </div>
    </div>
  );
}

const features: FeatureItem[] = [
  {
    id: 0,
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Blazing fast performance with sub-second email loading. No lag, no wait — sirf speed.',
    detailText: 'Next.js 14 server side caching aur optimized webpack builds se Patr load hota hai sub-second levels pe, chahe connection slow kyu na ho.',
    gradient: 'from-amber-400 to-orange-600',
    mockComponent: SpeedMockup,
  },
  {
    id: 1,
    icon: Flag,
    title: 'Made in India',
    description: 'Proudly designed & hosted in India. Your data stays in Bharat, always.',
    detailText: 'Aapka privacy aur data sovereignity hamari absolute priority hai. Hamare servers physical locations Mumbai aur Bangalore ke secure zones mein hain.',
    gradient: 'from-orange-500 to-emerald-600',
    mockComponent: IndiaMockup,
  },
  {
    id: 2,
    icon: ShieldCheck,
    title: 'Bank-Grade Security',
    description: 'End-to-end encryption, 2FA, aur advanced threat protection. Aapka data safe hai.',
    detailText: 'Har user account 2-Step verification aur cryptographic database levels se guarded hai. Faltu spam mails automatic block ho jaate hain.',
    gradient: 'from-emerald-400 to-teal-600',
    mockComponent: SecurityMockup,
  },
  {
    id: 3,
    icon: Tags,
    title: 'Smart Labels',
    description: 'AI-powered labels aur filters jo automatically organise karte hain aapka inbox.',
    detailText: 'Spam, Social, aur Personal filters automatic dynamic mailboxes mein route ho jaate hain taaki aapka focus hamesha important updates pe rahe.',
    gradient: 'from-blue-400 to-indigo-600',
    mockComponent: SmartLabelsMockup,
  },
  {
    id: 4,
    icon: Share2,
    title: 'File Sharing',
    description: '5GB tak free file sharing. Large attachments bhi asaani se bhejo.',
    detailText: 'Badi size ki media files, documents, aur archives bina compress kiye turant forward karein. Safe storage buckets are allocated to you.',
    gradient: 'from-purple-400 to-pink-600',
    mockComponent: FileSharingMockup,
  },
  {
    id: 5,
    icon: Palette,
    title: 'Beautiful Design',
    description: 'Modern, clean UI jo dekhne mein bhi sundar hai aur use karne mein bhi.',
    detailText: 'Adaptive Dark/Light layout models with micro-animations aur premium glassmorphism layouts. Ergonomic design standard touch targets.',
    gradient: 'from-pink-400 to-rose-600',
    mockComponent: DesignMockup,
  },
];

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeId, setActiveId] = useState(0);
  const [cards, setCards] = useState(features);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setCards((prev) => {
      const next = [...prev];
      const top = next.shift();
      if (top) {
        next.push(top);
      }
      return next;
    });
  };

  const ActiveMock = features[activeId].mockComponent;

  // Radius of the orbiting features wheel
  const dialRadius = 160;

  return (
    <section id="features" ref={ref} className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background glowing rings */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-dashed border-patr-orange animate-spin [animation-duration:60s]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-1 px-4 py-1.5 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-patr-orange/10 text-patr-orange border border-patr-orange/20 shadow-sm">
            <Compass className="w-3.5 h-3.5" />
            <span>Khaas Kyu Hai?</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
            Kya hai <span className="gradient-text font-black">Patr</span> mein alag?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Bharat ke modern digital users ke liye designed features jo aapke kaam ko banayein aasaan aur surakshit.
          </p>
        </motion.div>

        {/* ── Desktop Futuristic 3D Orbiting Dial Layout ────── */}
        <div className="hidden lg:grid grid-cols-12 gap-12 items-center min-h-[480px]">
          
          {/* Left: 3D Orbiting Dial Rotator */}
          <div className="col-span-5 flex justify-center relative">
            <div className="relative w-[380px] h-[380px] flex items-center justify-center">
              
              {/* Outer Orbit Ring */}
              <motion.div
                animate={{ rotate: -activeId * 60 }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-border/40 flex items-center justify-center"
              >
                {features.map((feat, idx) => {
                  const Icon = feat.icon;
                  const angle = (idx * 60 * Math.PI) / 180;
                  const x = Number((Math.cos(angle) * dialRadius).toFixed(3));
                  const y = Number((Math.sin(angle) * dialRadius).toFixed(3));
                  const active = activeId === feat.id;

                  return (
                    <motion.button
                      key={feat.id}
                      onClick={() => setActiveId(feat.id)}
                      // Rotate nodes back in opposite direction to keep icons upright
                      animate={{ rotate: activeId * 60 }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${x}px - 22px)`,
                        top: `calc(50% + ${y}px - 22px)`,
                      }}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center text-foreground bg-card border border-border/60 shadow-lg hover:scale-110 active:scale-95 transition-all focus:outline-none z-20',
                        active && 'border-patr-orange ring-4 ring-patr-orange/15 scale-110 bg-gradient-to-br text-white ' + feat.gradient
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Central Core */}
              <div className="relative z-10 w-24 h-24 rounded-full border border-white/[0.08] bg-card/80 backdrop-blur-xl shadow-2xl flex items-center justify-center flex-col">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-patr-orange to-orange-600 opacity-10 animate-ping [animation-duration:3s]" />
                <Orbit className="w-8 h-8 text-patr-orange animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground mt-1 tracking-widest uppercase">Core</span>
              </div>

            </div>
          </div>

          {/* Right: Dashboard Detail View */}
          <div className="col-span-7 flex flex-col justify-between p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden preserve-3d perspective-1000 min-h-[440px]">
            {/* Ambient background glow matching active feature */}
            <div className={cn('absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-br opacity-10 rounded-full blur-3xl pointer-events-none transition-all duration-500', features[activeId].gradient)} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className={cn('inline-flex p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg mb-6', features[activeId].gradient)}>
                    {(() => {
                      const Icon = features[activeId].icon;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
                    {features[activeId].title}
                  </h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    {features[activeId].detailText}
                  </p>
                </div>

                {/* Simulated interactive component in dashboard */}
                <div className="w-full h-44 border border-border/50 bg-background/50 rounded-2xl shadow-inner mt-6 overflow-hidden flex items-center justify-center">
                  <ActiveMock />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Mobile Tinder-Style Swipable Card Stack ────── */}
        <div className="lg:hidden relative h-[450px] w-full max-w-[320px] mx-auto flex items-center justify-center mt-10">
          <AnimatePresence mode="popLayout">
            {cards.slice(0, 3).reverse().map((feat, index, arr) => {
              const isTop = index === arr.length - 1;
              const Icon = feat.icon;
              const Mock = feat.mockComponent;

              return (
                <motion.div
                  key={feat.id}
                  style={{
                    zIndex: index + 10,
                  }}
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(event, info) => {
                    const threshold = 100;
                    if (info.offset.x > threshold) {
                      handleSwipe('right');
                    } else if (info.offset.x < -threshold) {
                      handleSwipe('left');
                    }
                  }}
                  initial={{
                    scale: 0.9,
                    y: index * 12,
                    opacity: 0,
                  }}
                  animate={{
                    scale: isTop ? 1 : index === 1 ? 0.95 : 0.9,
                    y: isTop ? 0 : index === 1 ? 12 : 24,
                    opacity: isTop ? 1 : index === 1 ? 0.8 : 0.5,
                  }}
                  exit={{
                    x: swipeDirection === 'right' ? 400 : -400,
                    opacity: 0,
                    rotate: swipeDirection === 'right' ? 25 : -25,
                    transition: { duration: 0.25 },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 22,
                  }}
                  className={cn(
                    "absolute w-full p-6 rounded-2xl border border-border/60 bg-card flex flex-col justify-between min-h-[380px] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing",
                    isTop && "border-patr-orange/30 shadow-patr-orange/5"
                  )}
                >
                  {isTop && (
                    <div className="absolute inset-0 border border-patr-orange/20 rounded-2xl pointer-events-none animate-pulse" />
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={cn('inline-flex p-2.5 rounded-xl bg-gradient-to-br text-white shadow-md', feat.gradient)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
                        Swipe to next →
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                  </div>

                  {/* Mockup visual */}
                  <div className="w-full h-32 border border-border/40 bg-background/40 rounded-xl mt-6 flex items-center justify-center overflow-hidden">
                    <Mock />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
export { Features };
