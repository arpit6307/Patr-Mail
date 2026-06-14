'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Patr kya hai aur yeh Gmail se kaise alag hai?',
    a: 'Patr ek modern, secure aur Made in India email service hai. Hum aapko ek free @patr.in email ID dete hain. Yeh simple Hinglish friendly interface, 5GB storage, local customer support aur higher privacy protection ke sath aati hai.',
  },
  {
    q: 'Kya Patr bilkul free hai?',
    a: 'Haan! Har user ko register karte hi 5GB storage bilkul free milta hai. Future mein hum premium features ke liye optional paid tiers layenge, par basic emailing hamesha free rahegi.',
  },
  {
    q: 'Kya mera data India ke bahar store hota hai?',
    a: 'Nahi. Aapka saara data, emails aur attachments pure Indian data centers par host kiye jaate hain. Yeh completely GDPR aur Indian data compliance guidelines ke mutabik hai.',
  },
  {
    q: 'Kya main Patr se Gmail ya Outlook users ko email bhej sakta hoon?',
    a: 'Bilkul! Patr ek standard email protocol use karta hai. Aap kisi bhi email provider (Gmail, Yahoo, Outlook, work email) ko mail bhej sakte hain aur unse receive bhi kar sakte hain.',
  },
  {
    q: 'Security ke liye Patr mein kya safety measures hain?',
    a: 'Hum database level par industry-standard encryption use karte hain. Phone authentication (OTP) se 2FA enable hota hai taaki koi aur aapka account bina ijazat na khol sake. Saath hi automated spam filters aapko fraud links se safe rakhte hain.',
  },
  {
    q: 'Agar mujhe help chahiye toh kaise contact karein?',
    a: 'Hum local support pradan karte hain. Aap dashboard se support ticket generate kar sakte hain, ya support@patr.in par mail bhej sakte hain. Hamaari team turant help karegi.',
  },
];

function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center py-5 text-left text-foreground font-bold hover:text-primary transition-colors focus:outline-none"
      >
        <span className="text-base sm:text-lg">{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold sm:text-4xl text-center text-foreground mb-12">
          Frequently Asked Questions (FAQ)
        </h2>

        <div className="space-y-1">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              q={faq.q}
              a={faq.a}
              isOpen={openIdx === idx}
              onClick={() => toggle(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
