'use client';

import { useState, useEffect, useRef } from 'react';
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
  // Added icons
  Globe,
  Smartphone,
  Compass,
  Music,
  Trash2,
  KeyRound,
  Check,
  X,
  Cpu,
  Sparkles,
  Tag,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'notifications' | 'security' | 'identity' | 'labels';

export interface ConnectedNode {
  id: string;
  name: string;
  type: 'browser' | 'device' | 'app' | 'website';
  details: string;
  location: string;
  timeAgo: string;
  iconName: 'chrome' | 'firefox' | 'android' | 'spotify' | 'netflix' | 'github' | 'bookmyshow';
}

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

  // Connected Nodes States
  const [nodes, setNodes] = useState<ConnectedNode[]>([
    { id: 'n1', name: 'Chrome on Windows PC', type: 'browser', details: 'IP: 192.168.1.45 (Active Session)', location: 'Delhi, India', timeAgo: 'Active now', iconName: 'chrome' },
    { id: 'n2', name: 'Samsung Galaxy S23', type: 'device', details: 'Patr Android App v1.2', location: 'Mumbai, India', timeAgo: '2 hours ago', iconName: 'android' },
    { id: 'n3', name: 'Spotify Music', type: 'app', details: 'Sign-in integration (OAuth)', location: 'Bengaluru, India', timeAgo: '3 days ago', iconName: 'spotify' },
    { id: 'n4', name: 'Firefox on macOS', type: 'browser', details: 'IP: 103.45.2.19', location: 'Delhi, India', timeAgo: '1 day ago', iconName: 'firefox' },
    { id: 'n5', name: 'Netflix (Smart TV)', type: 'app', details: 'Patr ID linked login', location: 'Noida, India', timeAgo: '5 days ago', iconName: 'netflix' },
    { id: 'n6', name: 'GitHub OAuth', type: 'app', details: 'Developer OAuth sync', location: 'Delhi, India', timeAgo: '1 week ago', iconName: 'github' },
    { id: 'n7', name: 'BookMyShow App', type: 'website', details: 'Ticket Booking portal', location: 'Mumbai, India', timeAgo: '2 weeks ago', iconName: 'bookmyshow' },
  ]);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const [disintegratingIds, setDisintegratingIds] = useState<string[]>([]);
  const [securityPin, setSecurityPin] = useState('1234');
  const [currentPinInput, setCurrentPinInput] = useState('');

  // Label Manager states
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');
  const [labelError, setLabelError] = useState<string | null>(null);

  const defaultLabels = [
    { name: 'Work', color: 'bg-blue-500' },
    { name: 'Personal', color: 'bg-green-500' },
    { name: 'Finance', color: 'bg-yellow-500' },
  ];

  const currentLabels = user?.labels || defaultLabels;

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Load Security PIN from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = localStorage.getItem('patr_security_pin') || '1234';
      setSecurityPin(savedPin);
      setCurrentPinInput(savedPin);
    }
  }, []);

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || !user) return;
    setLabelError(null);

    const nameTrimmed = newLabelName.trim();
    if (currentLabels.some((l) => l.name.toLowerCase() === nameTrimmed.toLowerCase())) {
      setLabelError('Is naam ka label pehle se hi exist karta hai.');
      return;
    }

    const newLabel = {
      name: nameTrimmed,
      color: selectedColor,
    };

    const updatedLabels = [...(user.labels || defaultLabels), newLabel];

    try {
      await updateUserDoc(user.uid, { labels: updatedLabels });
      const updatedUser = { ...user, labels: updatedLabels };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
      setNewLabelName('');
      setSelectedColor('bg-blue-500');
    } catch (err) {
      console.error('Error creating label:', err);
      setLabelError('Label create karne mein error aayi.');
    }
  };

  const handleDeleteLabel = async (labelName: string) => {
    if (!user) return;
    const updatedLabels = currentLabels.filter((l) => l.name !== labelName);

    try {
      await updateUserDoc(user.uid, { labels: updatedLabels });
      const updatedUser = { ...user, labels: updatedLabels };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error deleting label:', err);
    }
  };

  const handleToggleNode = (nodeId: string) => {
    if (nodeId === 'n1') return; // Cannot delete current active session

    if (selectedNodeIds.includes(nodeId)) {
      setSelectedNodeIds(selectedNodeIds.filter(id => id !== nodeId));
    } else {
      setSelectedNodeIds([...selectedNodeIds, nodeId]);
    }
  };

  const handlePinDigitChange = (index: number, val: string) => {
    const newVal = val.replace(/[^0-9]/g, '');
    const updatedDigits = [...pinDigits];
    updatedDigits[index] = newVal;
    setPinDigits(updatedDigits);

    // Auto-focus next input
    if (newVal !== '' && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pinDigits[index] === '' && index > 0) {
      const updatedDigits = [...pinDigits];
      updatedDigits[index - 1] = '';
      setPinDigits(updatedDigits);
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyAndErase = async () => {
    const enteredPin = pinDigits.join('');
    if (enteredPin !== securityPin) {
      setPinError('Galat PIN! Dubara try karein (Default: 1234)');
      setPinDigits(['', '', '', '']);
      pinRefs[0].current?.focus();
      return;
    }

    // PIN is correct, trigger disintegration
    setDisintegratingIds([...disintegratingIds, ...selectedNodeIds]);
    setShowPinModal(false);
    setSelectedNodeIds([]);
    setPinDigits(['', '', '', '']);
    setPinError(null);

    // Play alert chime
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Audio Context failed in settings:', e);
    }

    // Complete removal after animation finished
    setTimeout(() => {
      setNodes(prev => prev.filter(n => !selectedNodeIds.includes(n.id)));
      setDisintegratingIds(prev => prev.filter(id => !selectedNodeIds.includes(id)));
      
      // Add a system notification about revocation
      try {
        const cache = localStorage.getItem('patr_notifications');
        const list = cache ? JSON.parse(cache) : [];
        const newNotif = {
          id: Math.random().toString(36).substring(7),
          title: 'Deauthorized Selected Nodes! 🛑',
          message: 'Linked apps aur external device sessions successfully deauthorise ho chuke hain.',
          type: 'security',
          isRead: false,
          receivedAt: new Date().toISOString(),
        };
        localStorage.setItem('patr_notifications', JSON.stringify([newNotif, ...list]));
      } catch (e) {}
    }, 1000);
  };

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
    { id: 'security', label: 'Account & Security', icon: Lock },
    { id: 'identity', label: 'Digital Footprint Map', icon: Cpu },
    { id: 'labels', label: 'Labels Manager', icon: Tag },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Futuristic Header with Background Glow */}
        <div className="relative p-6 rounded-3xl border border-border/60 bg-gradient-to-r from-card/80 to-card/20 backdrop-blur-md overflow-hidden shadow-sm">
          {/* Neon mesh background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-patr-orange/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-patr-orange/20 text-patr-orange border border-patr-orange/30">
                  Settings Hub
                </span>
                <span className="text-xs text-muted-foreground font-semibold">• Preferences</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-1.5 flex items-center gap-2">
                Mailbox & Account Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apne mailbox, layout, security aur custom labels ko customize karein</p>
            </div>
          </div>
        </div>

        {/* Premium Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Tab Navigation */}
          <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-border/40 lg:sticky lg:top-20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all focus:outline-none text-left whitespace-nowrap lg:whitespace-normal w-auto lg:w-full select-none shrink-0',
                    active
                      ? 'bg-patr-orange text-white shadow-lg shadow-patr-orange/20 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold'
                  )}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Viewport Content */}
          <div className="flex-1 w-full space-y-6">
            
            {/* SUCCESS / ERROR ALERTS */}
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in font-semibold">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Settings successfully save ho gayi hain!</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in font-semibold">
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
                        className="w-5 h-5 text-patr-orange border-border focus:ring-patr-orange rounded cursor-pointer"
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

            {/* ACCOUNT & SECURITY TAB */}
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

                {/* Identity PIN Settings */}
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4.5 h-4.5 text-patr-orange" />
                    <h3 className="text-sm font-bold text-foreground">Identity Verification PIN</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Linked apps aur websites se accounts delete aur deauthorise karne ke liye validation PIN (Default: <strong>1234</strong>)
                  </p>

                  <div className="flex gap-4 items-center">
                    <div className="relative max-w-[150px]">
                      <input
                        type="password"
                        maxLength={4}
                        value={currentPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCurrentPinInput(val);
                        }}
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-center text-lg tracking-widest font-mono"
                        placeholder="PIN"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPinInput.length !== 4) {
                          setError('PIN 4-digit ka hona chahiye.');
                          return;
                        }
                        localStorage.setItem('patr_security_pin', currentPinInput);
                        setSecurityPin(currentPinInput);
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 3000);
                      }}
                      className="px-5 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all"
                    >
                      PIN Save Karo
                    </button>
                  </div>
                </div>

                {/* Help & Support */}
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-patr-orange" />
                    <h3 className="text-sm font-bold text-foreground">Sahaayata (Support)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    Agar aapko Patr email chalane mein koi bhi dikkat aati hai, ya koi suggestion hai, toh aap humein mail kar sakte hain. Hum hamesha aapki sahaayata ke liye tatpar hain! 🇮🇳
                  </p>
                  <p className="text-xs font-bold text-patr-orange">
                    support@patr.in
                  </p>
                </div>

              </div>
            )}

            {/* DIGITAL FOOTPRINT MAP TAB */}
            {activeTab === 'identity' && (
              <div className="space-y-6">
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes patr-float-1 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(0.5deg); }
                  }
                  @keyframes patr-float-2 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(10px) rotate(-0.5deg); }
                  }
                  @keyframes patr-float-3 {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    50% { transform: translateY(-8px) translateX(8px); }
                  }
                  .patr-node-float-1 { animation: patr-float-1 6s infinite ease-in-out; }
                  .patr-node-float-2 { animation: patr-float-2 7s infinite ease-in-out; }
                  .patr-node-float-3 { animation: patr-float-3 8s infinite ease-in-out; }
                ` }} />

                <div className="border border-border/60 rounded-3xl bg-card/20 backdrop-blur p-6 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/30 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-patr-orange" />
                        Digital Footprint Connected Network Map
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Aapka Patr ID kahan-kahan connected hai. Revoke karne ke liye node select karein.</p>
                    </div>
                    {selectedNodeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPinModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Erase Selected ({selectedNodeIds.length})
                      </button>
                    )}
                  </div>

                  {/* Interactive Orbital Hub */}
                  <div className="relative border border-border/40 rounded-2xl bg-black/60 p-6 overflow-hidden min-h-[480px] flex flex-col items-center justify-center">
                    {/* Glowing Orbit Rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <div className="w-64 h-64 rounded-full border border-dashed border-patr-orange/80 animate-[spin_40s_linear_infinite]" />
                      <div className="w-96 h-96 rounded-full border border-dashed border-white/20 absolute animate-[spin_70s_linear_infinite_reverse]" />
                      <div className="w-[500px] h-[500px] rounded-full border border-white/5 absolute" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-center justify-center max-w-3xl">
                      {/* Left Column (Nodes 1, 2, 3) */}
                      <div className="space-y-6 flex flex-col justify-center">
                        {nodes.slice(0, 3).map((node, idx) => {
                          const isSelected = selectedNodeIds.includes(node.id);
                          const isDisintegrating = disintegratingIds.includes(node.id);
                          const Icon = 
                            node.iconName === 'chrome' ? Globe :
                            node.iconName === 'firefox' ? Compass :
                            node.iconName === 'android' ? Smartphone :
                            node.iconName === 'spotify' ? Music :
                            node.iconName === 'netflix' ? Laptop :
                            node.iconName === 'github' ? Settings : CalendarDays;

                          return (
                            <div
                              key={node.id}
                              onClick={() => handleToggleNode(node.id)}
                              className={cn(
                                "relative group p-4 border rounded-2xl bg-card/60 backdrop-blur-md cursor-pointer transition-all duration-500 select-none",
                                node.id === 'n1' ? "border-border/30 opacity-75 cursor-not-allowed" : "hover:border-patr-orange hover:bg-muted/10",
                                isSelected && "border-patr-orange ring-1 ring-patr-orange/50 shadow-[0_0_20px_rgba(255,107,53,0.35)] bg-patr-orange/[0.02]",
                                isDisintegrating && "opacity-0 scale-50 blur-lg rotate-12 duration-1000",
                                `patr-node-float-${(idx % 3) + 1}`
                              )}
                            >
                              <div className="hidden md:block absolute top-1/2 -right-4 w-4 h-[1px] bg-gradient-to-r from-border/40 to-patr-orange/40 pointer-events-none" />

                              <div className="flex gap-3 items-start">
                                <div className={cn(
                                  "p-2 rounded-xl bg-muted/60 shrink-0",
                                  isSelected && "bg-patr-orange/20 text-patr-orange"
                                )}>
                                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-patr-orange transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <h4 className="text-xs font-bold text-foreground truncate">{node.name}</h4>
                                  <p className="text-[10px] text-muted-foreground truncate">{node.details}</p>
                                  <p className="text-[9px] text-muted-foreground/70 font-semibold">{node.location} • {node.timeAgo}</p>
                                </div>
                                {node.id === 'n1' ? (
                                  <span className="text-[8px] bg-patr-orange/20 text-patr-orange px-1.5 py-0.5 rounded-full font-bold">Secured</span>
                                ) : isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-patr-orange flex items-center justify-center text-white shrink-0 mt-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border group-hover:border-patr-orange shrink-0 mt-0.5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Central Identity Hub Core */}
                      <div className="flex flex-col items-center justify-center space-y-4 py-8 relative">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-patr-orange/30 blur-2xl animate-pulse" />
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-24 h-24 rounded-full object-cover relative z-10 border-2 border-patr-orange shadow-[0_0_30px_rgba(255,107,53,0.5)] bg-card"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-patr-orange to-[#FF8C60] flex items-center justify-center text-white text-3xl font-bold relative z-10 border-2 border-patr-orange shadow-[0_0_30px_rgba(255,107,53,0.5)] select-none">
                              {user.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full border-2 border-patr-orange/40 animate-ping opacity-60 pointer-events-none" />
                          <div className="absolute -inset-4 rounded-full border border-white/5 animate-[pulse_2s_infinite] pointer-events-none" />
                        </div>
                        <div className="text-center relative z-10 space-y-1">
                          <h4 className="text-sm font-bold text-foreground">Identity Hub</h4>
                          <span className="text-[10px] text-patr-orange font-mono select-all bg-patr-orange/10 px-2.5 py-0.5 rounded-full inline-block border border-patr-orange/20">
                            {user.patrAddress}
                          </span>
                        </div>
                      </div>

                      {/* Right Column (Nodes 4, 5, 6, 7) */}
                      <div className="space-y-6 flex flex-col justify-center">
                        {nodes.slice(3).map((node, idx) => {
                          const isSelected = selectedNodeIds.includes(node.id);
                          const isDisintegrating = disintegratingIds.includes(node.id);
                          const Icon = 
                            node.iconName === 'chrome' ? Globe :
                            node.iconName === 'firefox' ? Compass :
                            node.iconName === 'android' ? Smartphone :
                            node.iconName === 'spotify' ? Music :
                            node.iconName === 'netflix' ? Laptop :
                            node.iconName === 'github' ? Settings : CalendarDays;

                          return (
                            <div
                              key={node.id}
                              onClick={() => handleToggleNode(node.id)}
                              className={cn(
                                "relative group p-4 border rounded-2xl bg-card/60 backdrop-blur-md cursor-pointer transition-all duration-500 select-none",
                                node.id === 'n1' ? "border-border/30 opacity-75 cursor-not-allowed" : "hover:border-patr-orange hover:bg-muted/10",
                                isSelected && "border-patr-orange ring-1 ring-patr-orange/50 shadow-[0_0_20px_rgba(255,107,53,0.35)] bg-patr-orange/[0.02]",
                                isDisintegrating && "opacity-0 scale-50 blur-lg rotate-12 duration-1000",
                                `patr-node-float-${((idx + 1) % 3) + 1}`
                              )}
                            >
                              <div className="hidden md:block absolute top-1/2 -left-4 w-4 h-[1px] bg-gradient-to-r from-patr-orange/40 to-border/40 pointer-events-none" />

                              <div className="flex gap-3 items-start">
                                <div className={cn(
                                  "p-2 rounded-xl bg-muted/60 shrink-0",
                                  isSelected && "bg-patr-orange/20 text-patr-orange"
                                )}>
                                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-patr-orange transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <h4 className="text-xs font-bold text-foreground truncate">{node.name}</h4>
                                  <p className="text-[10px] text-muted-foreground truncate">{node.details}</p>
                                  <p className="text-[9px] text-muted-foreground/70 font-semibold">{node.location} • {node.timeAgo}</p>
                                </div>
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-patr-orange flex items-center justify-center text-white shrink-0 mt-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border group-hover:border-patr-orange shrink-0 mt-0.5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-patr-orange/5 border border-patr-orange/20 text-xs text-muted-foreground leading-relaxed font-semibold">
                    <Sparkles className="w-5 h-5 text-patr-orange shrink-0" />
                    <span>
                      Patr&apos;s **Universal Sign-On** security protocol helps you terminate active OAuth tokens instantly. Disconnecting nodes will automatically request account erasure from partner servers and safely log out selected devices.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* LABELS TAB */}
            {activeTab === 'labels' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Create Label Form Card (2 cols) */}
                  <div className="md:col-span-2 border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm h-fit">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Naya Label Banao</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Apne emails tag karne ke liye naya label add karein</p>
                    </div>

                    <form onSubmit={handleCreateLabel} className="space-y-4">
                      {labelError && (
                        <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold animate-fade-in font-medium">
                          {labelError}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/80">Label Name</label>
                        <input
                          type="text"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="e.g. Work, Personal, Bills"
                          className="w-full h-10 px-3.5 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-xs"
                          required
                        />
                      </div>

                      {/* Choose Color */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/80 block">Choose Color</label>
                        <div className="flex gap-2.5">
                          {[
                            { value: 'bg-blue-500', name: 'Blue' },
                            { value: 'bg-emerald-500', name: 'Emerald' },
                            { value: 'bg-yellow-500', name: 'Yellow' },
                            { value: 'bg-rose-500', name: 'Rose' },
                            { value: 'bg-purple-500', name: 'Purple' },
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setSelectedColor(color.value)}
                              className={cn(
                                "w-6 h-6 rounded-full border border-transparent transition-all",
                                color.value,
                                selectedColor === color.value && "ring-2 ring-patr-orange ring-offset-2 ring-offset-background scale-110"
                              )}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Live Preview Card */}
                      <div className="border border-border/40 rounded-xl bg-background/40 p-4 space-y-2 select-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Live Preview</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Inbox Item preview:</span>
                          {newLabelName.trim() ? (
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm shrink-0", selectedColor)}>
                              {newLabelName.trim()}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Type name to see preview...</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-patr-orange text-white font-semibold text-xs hover:bg-[#E55A25] transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                        Naya Label Add Karo
                      </button>
                    </form>
                  </div>

                  {/* Existing Labels List Card (3 cols) */}
                  <div className="md:col-span-3 border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm h-fit">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Current Labels</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage your configured email categories</p>
                    </div>

                    {currentLabels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs font-semibold">
                        Koi custom labels nahi bane hain. Naya label banane ke liye form ka use karein.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin select-none">
                        {currentLabels.map((lbl) => (
                          <div
                            key={lbl.name}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40 group hover:border-patr-orange/50 transition-all animate-fade-in"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn("w-3 h-3 rounded-full shrink-0", lbl.color)} />
                              <span className="text-xs font-bold text-foreground truncate">{lbl.name}</span>
                            </div>

                            <button
                              onClick={() => handleDeleteLabel(lbl.name)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted/80 transition-colors"
                              title="Delete label"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* 4-Digit Security PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 p-6 backdrop-blur shadow-2xl space-y-5 text-center">
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-foreground">Confirm Authorization PIN</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                External account deletion confirm karne ke liye apna 4-digit Security PIN enter karein.
              </p>
            </div>

            <div className="flex justify-center gap-3 py-2">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type="password"
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${idx + 1}`}
                  onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className="w-12 h-14 rounded-xl border border-border bg-background/50 text-foreground text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-patr-orange focus:border-patr-orange transition-all font-mono"
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs font-bold text-red-500">{pinError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinDigits(['', '', '', '']);
                  setPinError(null);
                }}
                className="flex-1 h-10 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyAndErase}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all active:scale-[0.98]"
              >
                Delete Accounts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
