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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const router = useRouter();
  
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearNotification = useNotificationStore((s) => s.clearNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header with navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Bell className="w-6 h-6 text-patr-orange" />
                Notification Center
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Aapke updates, alerts aur actions yahan dikhenge</p>
            </div>
          </div>

          {/* Action buttons */}
          {notifications.length > 0 && (
            <div className="flex gap-2.5">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/50 hover:bg-muted text-xs font-semibold transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Sare Read Mark Karo
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                <Bell className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-foreground">Koi notification nahi hai</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Aapke account par sab kuch bilkul sahi chal raha hai! Jab koi naya email ya activity hogi, hum aapko yahan alert karenge. 🇮🇳
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group flex gap-4 p-4 border border-border/60 rounded-2xl bg-card/40 backdrop-blur hover:bg-muted/10 transition-all items-start shadow-sm',
                  !item.isRead && 'border-patr-orange/30 bg-patr-orange/[0.01] ring-1 ring-patr-orange/5'
                )}
              >
                {/* Icon wrapper */}
                <div className="p-2.5 rounded-xl bg-muted/60 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                {/* Info & Title */}
                <div
                  onClick={() => handleNotificationClick(item)}
                  className="flex-1 min-w-0 cursor-pointer space-y-1"
                >
                  <div className="flex justify-between items-center gap-2">
                    <h3 className={cn(
                      'text-sm truncate',
                      !item.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                    )}>
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getRelativeTime(item.receivedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {item.message}
                  </p>
                </div>

                {/* Action buttons (hover visible) */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      title="Read mark karo"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => clearNotification(item.id)}
                    title="Delete karo"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
