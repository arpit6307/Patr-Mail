'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { logoutUser } from '@/lib/firebase/auth';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Notifications Store
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/inbox" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-patr-orange">पत्र</span>
            <span className="text-lg font-semibold hidden sm:inline">Patr</span>
          </Link>
        </div>

        {/* Center: Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl hidden md:flex"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Patr mein search karo..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border
                         placeholder:text-muted-foreground text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         transition-all"
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search */}
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowDropdown(false);
              }}
              className={cn(
                "relative p-2 rounded-lg hover:bg-muted transition-colors",
                showNotifications && "bg-muted"
              )}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-patr-orange text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-lg py-2 flex flex-col max-h-96">
                  <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/10">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-[10px] text-patr-orange hover:underline font-bold"
                      >
                        Sare Read Mark Karo
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border/40">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Koi naya notification nahi hai!
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            markAsRead(item.id);
                            setShowNotifications(false);
                            if (item.actionUrl) router.push(item.actionUrl);
                          }}
                          className={cn(
                            "p-3.5 hover:bg-muted/40 cursor-pointer flex flex-col gap-1 transition-all",
                            !item.isRead && "bg-patr-orange/[0.01]"
                          )}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className={cn("text-xs truncate flex-1", !item.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-patr-orange shrink-0 mt-1" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground line-clamp-2">
                            {item.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="border-t border-border px-4 py-2.5 text-center text-xs font-bold text-patr-orange hover:bg-muted/30 transition-colors"
                  >
                    Sare Notifications Dekho
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="User menu"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-patr-orange/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-patr-orange flex items-center justify-center text-white text-sm font-semibold select-none shadow-sm">
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card shadow-lg py-2">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-patr-orange/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-patr-orange flex items-center justify-center text-white text-base font-bold shadow-sm select-none">
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@patr.in'}</p>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left hover:bg-muted transition-colors text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
