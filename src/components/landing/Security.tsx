'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, EyeOff, Server, CheckCircle2 } from 'lucide-react';

const securityFeatures = [
  'End-to-End Encryption (Aapke emails sirf aap padh sakte hain)',
  '2-Factor Authentication (OTP verification phone number par)',
  'Indian Data Hosting (Sari files aur data Bharat ke servers par safe hai)',
  'Spam & Phishing Blockers (Faltu aur fraud emails se suraksha)',
];

export default function Security() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Details */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Shield className="w-4 h-4" />
              Surakshit Aur Bharosemand
            </div>
            <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground mb-6">
              Aapki Privacy, Hamari Zimmedari
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Patr ko banate waqt security ko sabse pehle rakha gaya hai. Hum aapke data ko sell nahi karte, aur aapke saare messages bank-grade security ke sath encrypt kiye jaate hain.
            </p>

            <ul className="space-y-4">
              {securityFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">{feat}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right Column: Visual Shield Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Secure Server Connection
                </span>
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-4">
                Encrypted Database
              </h3>
              
              <div className="space-y-4 font-mono text-xs text-muted-foreground/85 mb-8">
                <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <span className="text-primary">SHA-256</span> hash: 8f39a0bde38d9c...
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <span className="text-primary">Status</span>: Secured & Monitored
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-foreground/95 bg-primary/5 p-4 rounded-xl border border-primary/20">
                <Server className="w-5 h-5 text-primary shrink-0" />
                <span>100% Indian Servers par hosted aur secure.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
