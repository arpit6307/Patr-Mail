'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Indian Flag SVG Component ───────────────────────────── */
function IndianFlagIcon() {
  return (
    <svg className="w-4.5 h-3 rounded-sm shadow-sm border border-border/20 inline-block align-middle ml-1" viewBox="0 0 3 2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="0.666" fill="#FF9933" />
      <rect y="0.666" width="3" height="0.666" fill="#FFFFFF" />
      <rect y="1.333" width="3" height="0.666" fill="#138808" />
      <circle cx="1.5" cy="1" r="0.2" fill="#000080" />
    </svg>
  );
}

export default function Footer() {
  const [productOpen, setProductOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <footer className="bg-card border-t border-border/50 py-12 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          
          {/* Logo & Tagline (Always visible, full-width on mobile) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-bold text-patr-orange">पत्र</span>
              <span className="text-xl font-bold text-foreground">Patr</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              India ka Apna Inbox — Built for speed, convenience, and absolute data privacy.
            </p>
          </div>

          {/* Product links (Collapsible on mobile) */}
          <div className="border-b md:border-b-0 border-border/30 pb-3 md:pb-0">
            <button
              onClick={() => setProductOpen(!productOpen)}
              className="w-full md:hidden flex justify-between items-center py-2 text-sm font-bold text-foreground uppercase tracking-wider focus:outline-none"
            >
              <span>Product</span>
              {productOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <h4 className="hidden md:block text-sm font-bold text-foreground uppercase tracking-wider mb-4">Product</h4>
            
            <ul className={cn(
              'space-y-2 text-sm text-muted-foreground mt-2 md:mt-0 transition-all duration-300 md:block',
              productOpen ? 'block' : 'hidden'
            )}>
              <li>
                <Link href="#features" className="hover:text-primary transition-colors py-1 block">Features</Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-primary transition-colors py-1 block">How It Works</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors py-1 block">Login</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy links (Collapsible on mobile) */}
          <div className="border-b md:border-b-0 border-border/30 pb-3 md:pb-0">
            <button
              onClick={() => setLegalOpen(!legalOpen)}
              className="w-full md:hidden flex justify-between items-center py-2 text-sm font-bold text-foreground uppercase tracking-wider focus:outline-none"
            >
              <span>Legal</span>
              {legalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <h4 className="hidden md:block text-sm font-bold text-foreground uppercase tracking-wider mb-4">Legal</h4>

            <ul className={cn(
              'space-y-2 text-sm text-muted-foreground mt-2 md:mt-0 transition-all duration-300 md:block',
              legalOpen ? 'block' : 'hidden'
            )}>
              <li>
                <Link href="#" className="hover:text-primary transition-colors py-1 block">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors py-1 block">Terms of Service</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors py-1 block">Security Audit</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Copyright / Tagline */}
        <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Patr.in. All rights reserved.</span>
          <span className="flex items-center justify-center gap-1.5 flex-wrap">
            <span>Developed with</span>
            <Heart className="w-4 h-4 fill-red-500 stroke-red-500 animate-pulse inline" />
            <span className="font-bold text-foreground">Arpit Singh Yadav</span>
            <IndianFlagIcon />
          </span>
        </div>

      </div>
    </footer>
  );
}
export { Footer };
