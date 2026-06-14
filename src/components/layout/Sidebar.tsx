'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  Send,
  FileText,
  Star,
  Trash2,
  Archive,
  Tag,
  Settings,
  PenSquare,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useEmailStore } from '@/store/emailStore';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  color?: string;
}

const mainLinks: SidebarLink[] = [
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Starred', href: '/starred', icon: Star },
  { label: 'Sent', href: '/sent', icon: Send },
  { label: 'Drafts', href: '/drafts', icon: FileText },
];

const secondaryLinks: SidebarLink[] = [
  { label: 'Spam', href: '/spam', icon: AlertTriangle },
  { label: 'Trash', href: '/trash', icon: Trash2 },
  { label: 'Archive', href: '/archive', icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const openCompose = useEmailStore((s) => s.openCompose);

  // Hardcoded counts for now (will come from realtime later)
  const inboxCount = 0;
  const draftCount = 0;

  const getCounts = (href: string) => {
    if (href === '/inbox') return inboxCount;
    if (href === '/drafts') return draftCount;
    return undefined;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-[260px] border-r border-border bg-card',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'flex flex-col',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Compose button */}
        <div className="p-4">
          <button
            onClick={() => openCompose()}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl
                       bg-patr-orange text-white font-semibold text-sm
                       shadow-md hover:shadow-lg hover:bg-[#E55A25]
                       transition-all duration-200 active:scale-95"
          >
            <PenSquare className="w-5 h-5" />
            Compose
          </button>
        </div>

        {/* Main links */}
        <nav className="flex-1 overflow-y-auto px-3 scrollbar-thin">
          <div className="space-y-0.5">
            {mainLinks.map((link) => {
              const isActive = pathname === link.href;
              const count = getCounts(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={isActive}
                  className="sidebar-item"
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <link.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <hr className="my-3 border-border" />

          {/* Labels section */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Labels
              </span>
              <button className="text-xs text-primary hover:underline">
                + New
              </button>
            </div>
            <div className="space-y-0.5">
              {[
                { name: 'Work', color: 'bg-blue-500' },
                { name: 'Personal', color: 'bg-green-500' },
                { name: 'Finance', color: 'bg-yellow-500' },
              ].map((label) => (
                <button
                  key={label.name}
                  className="sidebar-item w-full text-left"
                >
                  <span className={cn('w-3 h-3 rounded-full shrink-0', label.color)} />
                  <span className="flex-1 truncate">{label.name}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="my-3 border-border" />

          {/* Secondary links */}
          <div className="space-y-0.5">
            {secondaryLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={isActive}
                  className="sidebar-item"
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <link.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Settings at bottom */}
        <div className="border-t border-border p-3">
          <Link
            href="/settings"
            data-active={pathname === '/settings'}
            className="sidebar-item"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="flex-1">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
