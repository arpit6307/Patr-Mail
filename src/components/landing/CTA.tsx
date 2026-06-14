'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-patr-orange/20 via-transparent to-patr-blue/10 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 sm:p-16 rounded-3xl bg-gradient-to-r from-patr-orange to-orange-600 shadow-xl text-center text-white relative overflow-hidden"
        >
          {/* Decorative shapes */}
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <h2 className="text-3xl font-extrabold sm:text-5xl tracking-tight mb-4">
            Toh Phir Der Kis Baat Ki?
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8 font-medium">
            Aaj hi apna free <span className="underline font-bold">@patr.in</span> email ID register karein aur simple, lightning fast emailing ka anubhav karein.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-patr-orange bg-white hover:bg-orange-50 transition-colors shadow-md hover:scale-105 duration-300"
            >
              Apna Patr ID Banao
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-bold rounded-xl text-white hover:bg-white/10 transition-colors duration-300"
            >
              Login Karo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
