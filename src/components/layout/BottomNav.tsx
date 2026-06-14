'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Search, PenSquare, Star, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailStore } from '@/store/emailStore';

const navItems = [
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Compose', href: '#compose', icon: PenSquare, isCompose: true },
  { label: 'Starred', href: '/starred', icon: Star },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const openCompose = useEmailStore((s) => s.openCompose);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCompose) {
            return (
              <button
                key={item.label}
                onClick={() => openCompose()}
                className="flex flex-col items-center justify-center -mt-5"
                aria-label="Compose"
              >
                <div className="w-12 h-12 rounded-full bg-patr-orange text-white flex items-center justify-center shadow-lg">
                  <item.icon className="w-6 h-6" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px]',
                'transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
