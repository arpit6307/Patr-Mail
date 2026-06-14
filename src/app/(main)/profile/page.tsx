'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserDoc } from '@/lib/firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase/config';
import { User, Phone, Mail, Calendar, Shield, Save, CheckCircle, AlertCircle, HardDrive, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo 5MB se kam ki honi chahiye.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const { uploadAvatar } = await import('@/lib/firebase/storage');
      
      // 1. Upload to Supabase Storage
      const photoURL = await uploadAvatar(user.uid, file);

      // 2. Update Auth user photoURL
      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { photoURL });
      }

      // 3. Update Firestore user document
      await updateUserDoc(user.uid, { photoURL });

      // 4. Update Zustand state & LocalStorage cache
      const updatedUser = {
        ...user,
        photoURL,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError('Profile photo upload karne mein dikkat aayi.');
    } finally {
      setUploading(false);
    }
  };

  // Sync component state with store user data
  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Kripya apna naam enter karein.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update Auth profile display name
      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, {
          displayName: fullName.trim(),
        });
      }

      // 2. Update Firestore user doc
      const updatedData = {
        displayName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      };
      await updateUserDoc(user.uid, updatedData);

      // 3. Update Zustand Store and LocalStorage cache
      const updatedUser = {
        ...user,
        ...updatedData,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Profile update karne mein dikkat aayi. Kripya dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'U';
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'N/A';
    if (typeof createdAt.seconds === 'number') {
      return new Date(createdAt.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return new Date(createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formattedDate = getFormattedDate(user.createdAt);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mera Profile</h1>
          <p className="text-sm text-muted-foreground">Aapka account detail aur profile settings yahan badlein</p>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Avatar and quick info */}
          <div className="md:col-span-1 border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="relative group w-24 h-24 mb-4 select-none">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-patr-orange/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-patr-orange to-[#FF8C60] flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-patr-orange/20">
                  {getInitials(user.displayName)}
                </div>
              )}
              {/* Hover Edit Overlay */}
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                <Camera className="w-5 h-5 mb-1" />
                Change DP
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-patr-orange" />
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground truncate max-w-full">{user.displayName}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1 select-all">{user.patrAddress}</p>
            
            <div className="w-full border-t border-border/40 my-5" />

            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span>Account Status</span>
              <span className="flex items-center gap-1 font-bold text-emerald-500">
                <Shield className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>

          {/* Edit form */}
          <div className="md:col-span-2 border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Edit Details</h3>

              {success && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Profile details successfully save ho gaye hain!</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                  placeholder="Apna Pura Naam Likhye"
                  disabled={loading}
                />
              </div>

              {/* Patr ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Patr Address
                </label>
                <input
                  type="text"
                  value={user.patrAddress}
                  disabled
                  className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 text-muted-foreground cursor-not-allowed text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Aapka permanent Patr Address jisko badla nahi ja sakta</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Recovery Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                  placeholder="+91 XXXXX XXXXX"
                  disabled={loading}
                />
              </div>

              {/* Joined Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date Joined
                </label>
                <div className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 text-muted-foreground flex items-center text-sm">
                  {formattedDate}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <Save className="w-4.5 h-4.5" />
                  {loading ? 'Saving...' : 'Changes Save Karo'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Storage card */}
        <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-patr-orange" />
            <h3 className="text-base font-bold text-foreground">Storage Utilized</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
              <span>0.1 MB Used</span>
              <span>5.0 GB Free (100% left)</span>
            </div>
            <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
              <div className="w-[1%] h-full bg-patr-orange rounded-full" />
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              India ke apne email platform Patr par aapko hamesha ke liye 5GB safe storage free milta hai! 🇮🇳
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
