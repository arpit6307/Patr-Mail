'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { UserPlus, PenSquare, Send, CheckCircle2, ChevronRight, Terminal, Sparkles, Inbox, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  icon: any;
  label: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 0,
    icon: UserPlus,
    label: 'Step 1',
    title: 'Apna Account Banao',
    description: 'Sirf apna naam, phone number aur username daal kar register karein. Ek minute mein ID ready!',
  },
  {
    id: 1,
    icon: PenSquare,
    label: 'Step 2',
    title: 'Patr Likho',
    description: 'Hamare minimal rich text editor se email subject aur message draft karein. Attachments bhi include karein.',
  },
  {
    id: 2,
    icon: Send,
    label: 'Step 3',
    title: 'Turant Bhejo',
    description: 'Bina delay ke email lightning speed se forward hota hai. Live delivery monitoring status ke sath.',
  },
];

/* ── Step 1 Simulator: Registration Typing ───────────────── */
function SetupSimulator() {
  const [typedName, setTypedName] = useState('');
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    let nameIdx = 0;
    const nameStr = 'arpit_singh';
    
    const nameTimer = setInterval(() => {
      if (nameIdx < nameStr.length) {
        setTypedName((prev) => prev + nameStr[nameIdx]);
        nameIdx++;
      } else {
        clearInterval(nameTimer);
        setShowCheck(true);
      }
    }, 150);

    return () => clearInterval(nameTimer);
  }, []);

  return (
    <div className="w-full max-w-sm p-5 border border-white/[0.08] bg-muted/20 backdrop-blur rounded-2xl space-y-4 text-left font-sans shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <span className="text-xs font-bold text-foreground">Sign Up Wizard</span>
        <span className="text-[10px] text-patr-orange bg-patr-orange/10 px-2 py-0.5 rounded-full font-bold">Live Check</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Patr ID Choice</label>
        <div className="relative flex items-center">
          <div className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-xs flex items-center justify-between">
            <span className="text-foreground font-semibold">{typedName}</span>
            <span className="text-muted-foreground/80 font-bold mr-6">@patr.in</span>
          </div>
          <div className="absolute right-3">
            {showCheck ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </motion.div>
            ) : (
              <span className="w-2 h-2 rounded-full bg-patr-orange animate-ping" />
            )}
          </div>
        </div>
        {showCheck && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-400 font-bold">
            ID matches and available! 🎉
          </motion.p>
        )}
      </div>

      <div className="w-full h-8 bg-patr-orange text-white rounded-lg font-bold text-xs flex items-center justify-center cursor-default">
        <span>Aage Badho</span>
      </div>
    </div>
  );
}

/* ── Step 2 Simulator: Writing Email ─────────────────────── */
function ComposeSimulator() {
  const [typedSubject, setTypedSubject] = useState('');
  const [typedBody, setTypedBody] = useState('');

  useEffect(() => {
    let subIdx = 0;
    const subStr = 'Namaste India!';
    let bodyIdx = 0;
    const bodyStr = 'Patr is fast, secure and built in India.';

    const subTimer = setInterval(() => {
      if (subIdx < subStr.length) {
        setTypedSubject((prev) => prev + subStr[subIdx]);
        subIdx++;
      } else {
        clearInterval(subTimer);
        // Start typing body
        const bodyTimer = setInterval(() => {
          if (bodyIdx < bodyStr.length) {
            setTypedBody((prev) => prev + bodyStr[bodyIdx]);
            bodyIdx++;
          } else {
            clearInterval(bodyTimer);
          }
        }, 80);
      }
    }, 100);

    return () => {
      clearInterval(subTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-sm p-5 border border-white/[0.08] bg-muted/20 backdrop-blur rounded-2xl space-y-3.5 text-left font-sans shadow-md">
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-[10px] font-mono text-muted-foreground ml-2">compose_patr.exe</span>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] font-bold text-muted-foreground flex gap-2">
          <span className="w-8">To:</span>
          <span className="text-patr-orange font-semibold bg-patr-orange/5 px-2 py-0.5 rounded border border-patr-orange/20">amit@patr.in</span>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground flex gap-2 pt-1 border-t border-border/20">
          <span className="w-8">Sub:</span>
          <span className="text-foreground">{typedSubject}</span>
        </div>
      </div>

      <div className="h-16 p-2 rounded-lg bg-background/50 border border-border/40 text-[11px] font-mono text-foreground overflow-y-auto">
        {typedBody}
      </div>
    </div>
  );
}

/* ── Step 3 Simulator: Email Flight Path ────────────────── */
function DeliverySimulator() {
  return (
    <div className="w-full max-w-sm p-5 border border-white/[0.08] bg-muted/20 backdrop-blur rounded-2xl flex flex-col items-center justify-center min-h-[160px] text-center space-y-5 shadow-md">
      <div className="flex items-center justify-between w-full border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Terminal className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">delivery_status: active</span>
        </div>
      </div>

      <div className="flex items-center justify-between w-full px-6 relative">
        {/* Device Sender */}
        <div className="flex flex-col items-center gap-1.5 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-patr-orange/15 border border-patr-orange/25 flex items-center justify-center text-patr-orange">
            <PenSquare className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">Mobile</span>
        </div>

        {/* Flying particle envelope */}
        <div className="flex-1 h-0.5 border-t-2 border-dashed border-border/60 relative mx-3">
          <motion.div
            animate={{ x: [-10, 80], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 -translate-y-1/2 w-4.5 h-3 rounded bg-patr-orange shadow-md shadow-patr-orange/30 flex items-center justify-center"
          >
            <Send className="w-2.5 h-2.5 text-white" />
          </motion.div>
        </div>

        {/* Server Receiver */}
        <div className="flex flex-col items-center gap-1.5 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-patr-green/15 border border-patr-green/25 flex items-center justify-center text-patr-green">
            <Server className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">Server</span>
        </div>
      </div>

      <div className="w-full font-mono text-[9px] text-left text-muted-foreground/80 space-y-1 bg-background/50 p-2.5 rounded-lg border border-border/30">
        <div>&gt; resolving MX records... ok</div>
        <div>&gt; dispatching mailbox packet... <span className="text-emerald-400 font-bold">delivered (142ms)</span></div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });
  const [activeStep, setActiveStep] = useState(0);

  // Auto-scrolling interval to rotate steps automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={containerRef} id="how-it-works" className="py-20 sm:py-28 bg-muted/20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-patr-blue/10 text-patr-blue border border-patr-blue/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Journey</span>
          </span>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">
            Kaise Kaam Karta Hai?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground font-medium">
            Patr use karna behad aasaan hai. Humne iske flow ko simple aur intuitive banaya hai.
          </p>
        </div>

        {/* ── Simulated Interactive Console Dashboard ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Steps Toggles */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const active = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    'flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none',
                    active
                      ? 'bg-card border-patr-orange shadow-lg shadow-patr-orange/5 scale-[1.01]'
                      : 'border-border/30 hover:border-border/60 bg-card/10 hover:bg-card/25'
                  )}
                >
                  <div
                    className={cn(
                      'p-2.5 rounded-xl border shrink-0 transition-transform',
                      active
                        ? 'bg-patr-orange border-patr-orange text-white scale-110 shadow-md shadow-patr-orange/25'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider', active ? 'text-patr-orange' : 'text-muted-foreground/60')}>
                      {step.label}
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-0.5 flex items-center justify-between">
                      <span>{step.title}</span>
                      {active && <ChevronRight className="w-4 h-4 text-patr-orange shrink-0 animate-pulse" />}
                    </h3>
                    <p className="text-xs text-muted-foreground/95 mt-1.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Simulated Screen Emulator */}
          <div className="lg:col-span-7 flex justify-center items-center p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-card/50 backdrop-blur-xl shadow-2xl relative min-h-[300px] overflow-hidden">
            {/* Ambient background shadow decoration */}
            <div className="absolute -left-20 -top-20 w-72 h-72 bg-patr-orange/10 rounded-full blur-[80px] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="w-full flex justify-center"
              >
                {activeStep === 0 && <SetupSimulator />}
                {activeStep === 1 && <ComposeSimulator />}
                {activeStep === 2 && <DeliverySimulator />}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
export { HowItWorks };
