'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  X,
  Plus,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useEmailStore } from '@/store/emailStore';
import { useAuthStore } from '@/store/authStore';
import { updateUserDoc } from '@/lib/firebase/firestore';


interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  color?: string;
}

const mainLinks: SidebarLink[] = [
  { label: 'Primary', href: '/primary', icon: Mail },
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

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const selectedLabel = useEmailStore((s) => s.selectedLabel);
  const setSelectedLabel = useEmailStore((s) => s.setSelectedLabel);
  const router = useRouter();

  // Quick Label States
  const [isAdding, setIsAdding] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');

  const defaultLabels = [
    { name: 'Work', color: 'bg-blue-500' },
    { name: 'Personal', color: 'bg-green-500' },
    { name: 'Finance', color: 'bg-yellow-500' },
  ];

  const currentLabels = user?.labels || defaultLabels;

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || !user) return;

    const newLabel = {
      name: newLabelName.trim(),
      color: selectedColor,
    };

    const updatedLabels = [...(user.labels || defaultLabels), newLabel];

    try {
      // 1. Update Firestore
      await updateUserDoc(user.uid, { labels: updatedLabels });
      
      // 2. Update Zustand store & LocalStorage cache
      const updatedUser = {
        ...user,
        labels: updatedLabels,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));

      // Reset states
      setNewLabelName('');
      setIsAdding(false);
      setSelectedColor('bg-blue-500');
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleDeleteLabel = async (labelName: string) => {
    if (!user) return;
    const updatedLabels = currentLabels.filter((l) => l.name !== labelName);

    try {
      // If the currently selected label is deleted, clear the selection
      if (selectedLabel === labelName) {
        setSelectedLabel(null);
      }

      // 1. Update Firestore
      await updateUserDoc(user.uid, { labels: updatedLabels });
      
      // 2. Update Zustand store & LocalStorage cache
      const updatedUser = {
        ...user,
        labels: updatedLabels,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error deleting label:', err);
    }
  };

  const handleLabelClick = (labelName: string) => {
    if (selectedLabel === labelName) {
      setSelectedLabel(null);
    } else {
      setSelectedLabel(labelName);
      if (pathname !== '/inbox') {
        router.push('/inbox');
      }
    }
  };

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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] w-[260px] border-r border-border bg-card print:hidden',
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
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="text-xs text-patr-orange font-bold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {/* Quick add label inline form */}
            {isAdding && (
              <form onSubmit={handleCreateLabel} className="px-3 py-2 border border-border/60 rounded-xl bg-muted/10 mx-2 my-1.5 space-y-2 animate-fade-in select-none">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Label name..."
                  className="w-full bg-background border border-border/60 rounded-lg h-8 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-patr-orange text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  required
                />
                
                {/* Color Dots */}
                <div className="flex justify-between items-center gap-1.5">
                  <div className="flex gap-1">
                    {['bg-blue-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-rose-500', 'bg-purple-500'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border border-transparent transition-all",
                          color,
                          selectedColor === color && "ring-2 ring-patr-orange ring-offset-1 ring-offset-background scale-110"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-[10px] text-muted-foreground font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-[10px] text-patr-orange font-bold hover:underline"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-0.5">
              {currentLabels.map((label) => (
                <div
                  key={label.name}
                  onClick={() => handleLabelClick(label.name)}
                  className={cn(
                    "group/item flex items-center justify-between px-3 py-1 rounded-lg hover:bg-muted/30 text-foreground transition-all cursor-pointer select-none mx-1",
                    selectedLabel === label.name && "bg-patr-orange/10 text-patr-orange font-semibold hover:bg-patr-orange/15"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', label.color)} />
                    <span className="flex-1 truncate text-sm">{label.name}</span>
                  </div>
                  
                  {/* Delete button (hover visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLabel(label.name);
                    }}
                    className="p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-muted/80 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                    title="Delete label"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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

