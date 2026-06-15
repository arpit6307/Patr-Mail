'use client';

import { useNotificationStore, type NotificationItem } from '@/store/notificationStore';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Mail,
  Lock,
  Settings,
  HardDrive,
  Trash2,
  Check,
  CheckCheck,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type FilterType = 'all' | 'email' | 'security' | 'storage' | 'system';

export default function NotificationsPage() {
  const router = useRouter();
  
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearNotification = useNotificationStore((s) => s.clearNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-patr-orange" />;
      case 'security':
        return <Lock className="w-5 h-5 text-red-500" />;
      case 'storage':
        return <HardDrive className="w-5 h-5 text-amber-500" />;
      default:
        return <Settings className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval} yr pehle`;
      
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval} month pehle`;
      
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval} din pehle`;
      
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval} hr pehle`;
      
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval} min pehle`;
      
      return seconds < 10 ? 'Abhi abhi' : `${Math.floor(seconds)} sec pehle`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesSearch = searchQuery === '' || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filters: { type: FilterType; label: string; icon: any }[] = [
    { type: 'all', label: 'All', icon: Bell },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'security', label: 'Security', icon: Lock },
    { type: 'storage', label: 'Storage', icon: HardDrive },
    { type: 'system', label: 'System', icon: Settings },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background animate-fade-in">
      
      {/* Header Section - Full Width with Gradient */}
      <div className="relative border-b border-border/60 bg-gradient-to-r from-card/80 to-card/20 backdrop-blur-md">
        {/* Background Glow Effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-patr-orange/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-patr-orange/10 border border-patr-orange/20">
                  <Bell className="w-6 h-6 text-patr-orange" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      Notification Center
                    </h1>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-patr-orange text-white">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                    Aapke updates, alerts aur important actions
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {notifications.length > 0 && (
              <div className="flex gap-2.5">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-xl border border-border bg-background/50 hover:bg-muted text-xs font-semibold transition-all active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-semibold transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Search & Filter Section */}
        {notifications.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Notifications mein search karein..."
                  className="w-full h-11 pl-11 pr-10 rounded-xl border border-border bg-card/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin">
              {filters.map(filter => {
                const Icon = filter.icon;
                const isActive = filterType === filter.type;
                const count = filter.type === 'all' 
                  ? notifications.length 
                  : notifications.filter(n => n.type === filter.type).length;
                
                return (
                  <button
                    key={filter.type}
                    onClick={() => setFilterType(filter.type)}
                    className={cn(
                      'flex items-center gap-2 px-4 h-10 rounded-xl border font-semibold text-xs transition-all whitespace-nowrap active:scale-95',
                      isActive
                        ? 'border-patr-orange bg-patr-orange/10 text-patr-orange'
                        : 'border-border bg-card/40 text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                        isActive ? 'bg-patr-orange text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="border border-border/60 rounded-3xl bg-card/40 backdrop-blur p-16 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-patr-orange/20 to-patr-orange/5 flex items-center justify-center border border-patr-orange/20">
                  <Bell className="w-10 h-10 text-patr-orange/60" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-patr-orange/20 flex items-center justify-center border border-patr-orange/30">
                  <Sparkles className="w-3 h-3 text-patr-orange" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {searchQuery ? 'Koi result nahi mila' : 'Koi notification nahi hai'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  {searchQuery 
                    ? `"${searchQuery}" se match karne wali koi notification nahi mili. Koi aur search term try karein.`
                    : 'Aapke account par sab kuch bilkul sahi chal raha hai! Jab koi naya email ya activity hogi, hum aapko yahan alert karenge. 🇮🇳'
                  }
                </p>
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 px-4 h-10 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all active:scale-95"
                >
                  Search Clear Karo
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group relative flex gap-4 p-5 border border-border/60 rounded-2xl bg-card/40 backdrop-blur hover:bg-muted/10 transition-all items-start shadow-sm overflow-hidden',
                    !item.isRead && 'border-patr-orange/40 bg-patr-orange/[0.02] ring-1 ring-patr-orange/10'
                  )}
                >
                  {/* Unread Indicator */}
                  {!item.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-patr-orange rounded-r-full" />
                  )}

                  {/* Icon wrapper */}
                  <div className={cn(
                    'p-3 rounded-xl shrink-0 mt-0.5 border',
                    item.type === 'email' && 'bg-patr-orange/10 border-patr-orange/20',
                    item.type === 'security' && 'bg-red-500/10 border-red-500/20',
                    item.type === 'storage' && 'bg-amber-500/10 border-amber-500/20',
                    item.type === 'system' && 'bg-blue-500/10 border-blue-500/20'
                  )}>
                    {getIcon(item.type)}
                  </div>

                  {/* Info & Title */}
                  <div
                    onClick={() => handleNotificationClick(item)}
                    className="flex-1 min-w-0 cursor-pointer space-y-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h3 className={cn(
                        'text-sm leading-tight',
                        !item.isRead ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'
                      )}>
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3" />
                        {getRelativeTime(item.receivedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words pr-4">
                      {item.message}
                    </p>
                  </div>

                  {/* Action buttons (hover visible) */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        title="Read mark karo"
                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(item.id);
                      }}
                      title="Delete karo"
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border/60 pt-6 mt-6">
            <div className="flex flex-wrap gap-6 justify-center text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
                <p className="text-xs text-muted-foreground font-semibold">Total Notifications</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-patr-orange">{unreadCount}</p>
                <p className="text-xs text-muted-foreground font-semibold">Unread</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-emerald-500">{notifications.length - unreadCount}</p>
                <p className="text-xs text-muted-foreground font-semibold">Read</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
