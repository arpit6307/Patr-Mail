'use client';

import { useState, useEffect } from 'react';
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
  UserPlus,
  Loader2,
  Trash2,
  X as CloseIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useEmailStore } from '@/store/emailStore';
import { logoutUser } from '@/lib/firebase/auth';
import { getAccountsList, switchAccount, clearAllAccounts, removeAccount } from '@/lib/multiAccount';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const searchQuery = useEmailStore((s) => s.searchQuery);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  const [otherAccounts, setOtherAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (showDropdown && user) {
      const list = getAccountsList();
      setOtherAccounts(list.filter((a) => a.email.toLowerCase() !== user?.email?.toLowerCase()));
    }
  }, [showDropdown, user]);

  // Notifications Store
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const handleSearchFocus = () => {
    const emailRoutes = ['/inbox', '/sent', '/drafts', '/starred', '/archive', '/trash', '/spam', '/search'];
    if (!emailRoutes.includes(pathname)) {
      router.push('/search');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRoutes = ['/inbox', '/sent', '/drafts', '/starred', '/archive', '/trash', '/spam', '/search'];
    if (!emailRoutes.includes(pathname)) {
      router.push('/search');
    }
  };

  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState('');

  const handleAccountSwitch = async (email: string) => {
    setShowDropdown(false);
    setSwitchingEmail(email);
    
    await switchAccount(
      email,
      () => setIsSwitching(true),
      () => {
        setIsSwitching(false);
        window.location.reload();
      },
      (err) => {
        setIsSwitching(false);
        alert(err);
      }
    );
  };

  const handleAddAccount = async () => {
    setShowDropdown(false);
    await logoutUser();
    router.push('/login?addAccount=true');
  };

  const handleCreateNewAccount = async () => {
    setShowDropdown(false);
    await logoutUser();
    router.push('/register');
  };

  const handleLogoutAll = async () => {
    setShowDropdown(false);
    clearAllAccounts();
    await logoutUser();
    router.push('/login');
  };

  const handleRemoveSavedAccount = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccount(email);
    if (user) {
      const list = getAccountsList();
      setOtherAccounts(list.filter((a) => a.email.toLowerCase() !== user.email.toLowerCase()));
    }
  };

  const handleRemoveActiveAccount = async () => {
    if (!user?.email) return;
    setShowDropdown(false);
    removeAccount(user.email);
    await logoutUser();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-xl print:hidden">
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
              onFocus={handleSearchFocus}
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
          <Link
            href="/search"
            className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

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
            </button>

            <AnimatePresence>
              {showDropdown && (
                <>
                  {/* Backdrop overlay for closing */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  {/* Floating Dropdown Card (Solid background, completely non-transparent) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-[#10101d] dark:bg-[#10101d] shadow-2xl py-3 select-none text-xs opacity-100 flex flex-col"
                  >
                    {/* Active Account Info Card */}
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/20 rounded-t-2xl">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-patr-orange/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-patr-orange flex items-center justify-center text-white text-base font-bold shadow-md select-none">
                          {user?.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate text-foreground">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@patr.in'}</p>
                        <div className="mt-1.5 flex gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-patr-orange/15 text-patr-orange uppercase tracking-wider">
                            Active ID
                          </span>
                          <button
                            onClick={handleRemoveActiveAccount}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors uppercase tracking-wider"
                            title="Is account ko logout karke remove karein"
                          >
                            Logout & Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Switchable Accounts */}
                    <div className="py-1 flex-1 overflow-y-auto max-h-48 scrollbar-thin">
                      {otherAccounts.length > 0 && (
                        <div className="border-b border-border/50 pb-1">
                          <span className="px-4 py-1.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Switch Account
                          </span>
                          <div className="space-y-0.5">
                            {otherAccounts.map((account) => {
                              const initials = account.name?.[0]?.toUpperCase() || 'U';
                              return (
                                <div
                                  key={account.email}
                                  className="group flex items-center justify-between px-4 py-1.5 hover:bg-muted/40 transition-colors"
                                >
                                  <button
                                    onClick={() => handleAccountSwitch(account.email)}
                                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                                  >
                                    {account.photoURL ? (
                                      <img
                                        src={account.photoURL}
                                        alt={account.name}
                                        className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-border"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm select-none">
                                        {initials}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold truncate text-foreground">{account.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{account.email}</p>
                                    </div>
                                  </button>
                                  
                                  {/* Delete Account button */}
                                  <button
                                    onClick={(e) => handleRemoveSavedAccount(account.email, e)}
                                    className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Is account ko list se hatayein"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-1.5 border-t border-border/40">
                      <button
                        onClick={handleCreateNewAccount}
                        className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted transition-colors w-full text-left font-semibold text-foreground"
                      >
                        <UserPlus className="w-4 h-4 text-patr-orange" />
                        Naya Patr ID Banao
                      </button>

                      <button
                        onClick={handleAddAccount}
                        className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted transition-colors w-full text-left font-semibold text-foreground"
                      >
                        <UserPlus className="w-4 h-4 text-muted-foreground" />
                        Dusra Patr ID Login Karo
                      </button>
                      
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted transition-colors font-semibold text-foreground flex"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Settings
                      </Link>
                      
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted transition-colors font-semibold text-foreground flex"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        Profile Settings
                      </Link>
                      
                      <hr className="my-1.5 border-border" />
                      
                      <button
                        onClick={handleLogoutAll}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs w-full text-left hover:bg-muted transition-colors text-destructive font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Sabhi ID Se Logout Karo
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </header>

      {isSwitching && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in select-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#10101d] border border-border shadow-2xl max-w-xs text-center animate-scale-in">
            <Loader2 className="w-10 h-10 animate-spin text-patr-orange" />
            <div>
              <p className="text-sm font-bold text-white">Account Badla Ja Raha Hai...</p>
              <p className="text-xs text-muted-foreground mt-1.5 truncate max-w-[200px]">{switchingEmail}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
