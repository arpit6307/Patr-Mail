'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [particles, setParticles] = useState<{ id: number; angle: number; speed: number }[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerLaunch = () => {
    if (launching) return;
    setLaunching(true);

    // Create 10 burst particles
    const newParticles = Array.from({ length: 10 }).map((_, idx) => ({
      id: Math.random(),
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 60 + 40,
    }));
    setParticles(newParticles);

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Reset rocket position after animation duration
    setTimeout(() => {
      setLaunching(false);
      setParticles([]);
    }, 1200);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-auto"
          >
            {/* Ambient glowing aura */}
            <div className="absolute inset-0 bg-patr-orange/30 rounded-full blur-md scale-105" />

            <button
              onClick={triggerLaunch}
              className={cn(
                'relative w-14 h-14 rounded-full border border-white/10 dark:border-white/5 bg-card/90 backdrop-blur-xl shadow-2xl flex items-center justify-center transition-all focus:outline-none hover:border-patr-orange/40 hover:scale-105 active:scale-95 group overflow-hidden'
              )}
            >
              {/* Particle Sparks Burst */}
              {particles.map((p) => {
                return (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(p.angle) * p.speed,
                      y: Math.sin(p.angle) * p.speed,
                      opacity: 0,
                      scale: 0.2,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute w-2 h-2 rounded-full bg-patr-orange shadow-md shadow-patr-orange/50"
                  />
                );
              })}

              {/* Rocket icon with launch flight path */}
              <motion.div
                animate={
                  launching
                    ? {
                        y: [-10, -80],
                        scale: [1, 1.2, 0.8],
                        opacity: [1, 1, 0],
                      }
                    : { y: 0, scale: 1, opacity: 1 }
                }
                transition={
                  launching
                    ? { duration: 1, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 200, damping: 15 }
                }
                className="text-patr-orange group-hover:text-orange-600 transition-colors relative"
              >
                <Rocket className="w-6 h-6 rotate-[-45deg]" />
                
                {/* Propulsion Fire Flame Effect */}
                {launching && (
                  <motion.div
                    initial={{ scale: 0.2, opacity: 1 }}
                    animate={{ scale: [1, 1.5, 0.2], opacity: [1, 0.8, 0] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                    className="absolute -bottom-2 -left-1 w-2.5 h-4 bg-gradient-to-t from-red-500 via-orange-500 to-yellow-400 rounded-full blur-[1px] origin-top rotate-[-45deg]"
                  />
                )}
              </motion.div>

              {/* Pulsing rings around button when idle */}
              {!launching && (
                <div className="absolute inset-0 rounded-full border border-patr-orange/0 group-hover:border-patr-orange/20 scale-100 group-hover:scale-110 transition-all duration-500" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
export { ScrollToTop };
