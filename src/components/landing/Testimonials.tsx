'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: 'Gmail par hamesha storage full rehta tha aur interface itna complicated ho gaya tha. Patr behad simple hai aur Hinglish support toh kamaal hai! Made in India product use karne ka alag hi garv hai.',
    name: 'Aarav Sharma',
    role: 'Freelance Designer, Delhi',
    initials: 'AS',
  },
  {
    quote: 'Mera dhandha local clients ke sath chalta hai. Patr se mail bhejna aur files share karna bahut aasan hai. Mobile app interface smooth hai aur customer support bhi turant reply karta hai.',
    name: 'Priya Patel',
    role: 'Boutique Owner, Ahmedabad',
    initials: 'PP',
  },
  {
    quote: 'Patr ka minimal look aur fast speed mujhe sabse acchi lagi. AI-powered categories primary aur updates ko acche se separate karti hain. Five stars recommendation for everyone!',
    name: 'Kabir Verma',
    role: 'Tech Consultant, Bangalore',
    initials: 'KV',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
  }, [stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  return (
    <section className="py-20 bg-muted/20 relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground mb-12">
          Hamaare Users Kya Kehte Hain
        </h2>

        <div className="min-h-[250px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <Quote className="w-12 h-12 text-primary/30 mx-auto" />
              <p className="text-xl sm:text-2xl text-foreground/90 italic font-medium leading-relaxed max-w-3xl mx-auto">
                &ldquo;{testimonials[active].quote}&rdquo;
              </p>
              
              <div className="flex items-center justify-center gap-3 mt-8">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
                  {testimonials[active].initials}
                </div>
                <div className="text-left">
                  <h4 className="text-base font-bold text-foreground">{testimonials[active].name}</h4>
                  <p className="text-xs text-muted-foreground">{testimonials[active].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2.5 mt-10">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActive(idx);
                startAutoPlay();
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                active === idx ? 'bg-primary w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
