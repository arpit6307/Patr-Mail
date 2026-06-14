'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore, type LayoutDensity } from '@/store/uiStore';
import { updateUserDoc } from '@/lib/firebase/firestore';
import { sendPasswordResetEmail } from '@/lib/firebase/auth';
import {
  Settings,
  Sun,
  Moon,
  Volume2,
  Bell,
  Lock,
  Signature,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Keyboard,
  Laptop,
  AlignJustify,
  CalendarDays,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'notifications' | 'security';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const density = useUIStore((s) => s.density);
  const setDensity = useUIStore((s) => s.setDensity);
  const keyboardShortcuts = useUIStore((s) => s.keyboardShortcuts);
  const setKeyboardShortcuts = useUIStore((s) => s.setKeyboardShortcuts);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [signature, setSignature] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Vacation responder states
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationSubject, setVacationSubject] = useState('');
  const [vacationMessage, setVacationMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Security States
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Load preferences
  useEffect(() => {
    if (user) {
      setSignature(user.signature || '');
      setVacationEnabled(user.vacationResponderEnabled || false);
      setVacationSubject(user.vacationSubject || '');
      setVacationMessage(user.vacationMessage || '');
    }
    
    // Load local notification preferences
    const soundPref = localStorage.getItem('patr_pref_sound') !== 'false';
    const notifyPref = localStorage.getItem('patr_pref_notify') !== 'false';
    setSoundEnabled(soundPref);
    setNotificationsEnabled(notifyPref);
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20" />
          <div className="h-4 bg-primary/20 rounded w-28" />
        </div>
      </div>
    );
  }

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Save preferences in Firestore user doc
      const updatedData = {
        signature: signature.trim(),
        vacationResponderEnabled: vacationEnabled,
        vacationSubject: vacationSubject.trim(),
        vacationMessage: vacationMessage.trim(),
      };
      await updateUserDoc(user.uid, updatedData);

      // 2. Update local storage preferences
      localStorage.setItem('patr_pref_sound', String(soundEnabled));
      localStorage.setItem('patr_pref_notify', String(notificationsEnabled));

      // 3. Update Zustand Store and LocalStorage User doc
      const updatedUser = { 
        ...user, 
        ...updatedData
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Settings save karne mein dikkat aayi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setSecurityLoading(true);
    setResetSent(false);
    setResetError(null);

    try {
      const { success: resetSuccess, error: resetErr } = await sendPasswordResetEmail(user.email);
      if (resetSuccess) {
        setResetSent(true);
      } else {
        setResetError(resetErr || 'Password reset link nahi bheja ja saka.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError('Kuch galat hua. Kripya baad mein try karein.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: 'General Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Account & Auto-Responder', icon: Lock },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Apne mailbox ki preferences, design, aur security yahan customize karein</p>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-border/40 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all focus:outline-none whitespace-nowrap',
                  active
                    ? 'border-patr-orange text-patr-orange bg-patr-orange/[0.02]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6 pt-2">
          
          {/* SUCCESS / ERROR ALERTS */}
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>Settings successfully save ho gayi hain!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              
              {/* Theme Settings */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Theme Selection</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Light aur Dark themes ke beech switch karein</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  {/* Light Theme */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-xl border font-semibold text-sm transition-all",
                      theme === 'light'
                        ? "border-patr-orange bg-patr-orange/5 text-patr-orange font-bold ring-2 ring-patr-orange/20"
                        : "border-border bg-background/30 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <Sun className="w-4.5 h-4.5 text-amber-500" />
                    Light Mode
                  </button>

                  {/* Dark Theme */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-xl border font-semibold text-sm transition-all",
                      theme === 'dark'
                        ? "border-patr-orange bg-patr-orange/5 text-patr-orange font-bold ring-2 ring-patr-orange/20"
                        : "border-border bg-background/30 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <Moon className="w-4.5 h-4.5 text-indigo-400" />
                    Dark Mode
                  </button>
                </div>
              </div>

              {/* Layout Density Settings */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Layout Density</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Mail rows aur list elements ki details density choose karein</p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {(['comfortable', 'cozy', 'compact'] as LayoutDensity[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDensity(d)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border text-xs font-semibold capitalize transition-all",
                        density === d
                          ? "border-patr-orange bg-patr-orange/5 text-patr-orange font-bold ring-2 ring-patr-orange/20"
                          : "border-border bg-background/30 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <AlignJustify className={cn(
                        "w-4 h-4",
                        d === 'comfortable' && "scale-y-100",
                        d === 'cozy' && "scale-y-75",
                        d === 'compact' && "scale-y-50"
                      )} />
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts Settings */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Keyboard className="w-4.5 h-4.5 text-patr-orange" />
                      Keyboard Shortcuts
                    </h3>
                    <p className="text-xs text-muted-foreground">Shortcuts bind karein (e.g. <strong>C</strong> to Compose, <strong>G then I</strong> to go to Inbox)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keyboardShortcuts}
                      onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                      className="w-5 h-5 text-patr-orange border-border focus:ring-patr-orange rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Signature Settings */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Signature className="w-4.5 h-4.5 text-patr-orange" />
                  <h3 className="text-sm font-bold text-foreground">Default Email Signature</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Yeh signature naye email likhte waqt automatically end mein lag jayega
                </p>
                
                <textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm font-sans resize-none"
                  placeholder="Warm Regards,&#10;Apna Naam Likhye"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <Save className="w-4.5 h-4.5" />
                  {loading ? 'Saving...' : 'Preferences Save Karo'}
                </button>
              </div>

            </form>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-5 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Alert Preferences</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose how you want to be notified of new emails</p>
                </div>

                <div className="space-y-4">
                  {/* Desktop notifications toggle */}
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/30 hover:bg-muted/10 transition-colors cursor-pointer select-none">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-patr-orange shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-bold text-foreground">Desktop Notifications</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Naye email aane par browser popup notification dikhao</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 text-patr-orange border-border focus:ring-patr-orange rounded"
                    />
                  </label>

                  {/* Sound alerts toggle */}
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/30 hover:bg-muted/10 transition-colors cursor-pointer select-none">
                    <div className="flex items-start gap-3">
                      <Volume2 className="w-5 h-5 text-patr-orange shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-bold text-foreground">Sound Alerts</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Naye email aane par short sound alert play karein</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 text-patr-orange border-border focus:ring-patr-orange rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <Save className="w-4.5 h-4.5" />
                  {loading ? 'Saving...' : 'Notification Preferences Save Karo'}
                </button>
              </div>
            </form>
          )}

          {/* ACCOUNT & SECURITY / VACATION RESPONDER TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {/* Vacation Responder */}
              <form onSubmit={handleSaveGeneral} className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-patr-orange" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Vacation Auto-Responder (Out of Office)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Naye email aane par sender ko automatic auto-reply reply bhejein</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={vacationEnabled}
                    onChange={(e) => setVacationEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-patr-orange border-border focus:ring-patr-orange rounded cursor-pointer"
                  />
                </div>

                {vacationEnabled && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Auto-reply Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Auto-Reply Subject</label>
                      <input
                        type="text"
                        value={vacationSubject}
                        onChange={(e) => setVacationSubject(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                        placeholder="I am out of office / Chutti par hu"
                        required
                      />
                    </div>

                    {/* Auto-reply Body */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Auto-Reply Message</label>
                      <textarea
                        value={vacationMessage}
                        onChange={(e) => setVacationMessage(e.target.value)}
                        rows={4}
                        className="w-full p-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm font-sans resize-none"
                        placeholder="Hello, main abhi chutti par hu aur email check nahi kar pa raha. Wapas aakar reply karunga. Dhanyawad!"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Save className="w-4.5 h-4.5" />
                    {loading ? 'Saving...' : 'Auto-Responder Save Karo'}
                  </button>
                </div>
              </form>

              {/* Password Reset Section */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-patr-orange" />
                  <h3 className="text-sm font-bold text-foreground">Password Reset</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aapke registered email ID (<span className="font-semibold text-foreground">{user.email}</span>) par password reset link bheja jayega
                </p>

                {resetSent && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>Password reset email successfully bhej diya gaya hai! Kripya inbox check karein.</span>
                  </div>
                )}

                {resetError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={securityLoading}
                    className="flex items-center gap-2 px-5 h-11 rounded-xl bg-background border border-border text-foreground hover:bg-muted/40 font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {securityLoading ? 'Bhej rahe hain...' : 'Password Reset Email Bhejo'}
                  </button>
                </div>
              </div>

              {/* Help & Support */}
              <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4.5 h-4.5 text-patr-orange" />
                  <h3 className="text-sm font-bold text-foreground">Sahaayata (Support)</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Agar aapko Patr email chalane mein koi bhi dikkat aati hai, ya koi suggestion hai, toh aap humein mail kar sakte hain. Hum hamesha aapki sahaayata ke liye tatpar hain! 🇮🇳
                </p>
                <p className="text-xs font-bold text-patr-orange">
                  support@patr.in
                </p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
