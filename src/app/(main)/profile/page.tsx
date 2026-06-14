'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserDoc } from '@/lib/firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase/config';
import { User, Phone, Mail, Calendar, Shield, Save, CheckCircle, AlertCircle, HardDrive, Camera, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';


export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalFileName, setOriginalFileName] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo 5MB se kam ki honi chahiye.');
      return;
    }

    setOriginalFileName(file.name);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!user || !cropImageSrc || !croppedAreaPixels) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get cropped image file
      const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels, originalFileName);

      const { uploadAvatar } = await import('@/lib/firebase/storage');
      
      // 2. Upload to Supabase Storage
      const photoURL = await uploadAvatar(user.uid, croppedFile);

      // 3. Update Auth user photoURL
      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { photoURL });
      }

      // 4. Update Firestore user document
      await updateUserDoc(user.uid, { photoURL });

      // 5. Update Zustand state & LocalStorage cache
      const updatedUser = {
        ...user,
        photoURL,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setCropImageSrc(null); // Close modal
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
      setDob(user.dob || '');
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

    if (dob) {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) {
        setError('Kripya ek valid date of birth enter karein.');
        return;
      }
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setError('Aapki umar kam se kam 18 saal honi chahiye.');
        return;
      }
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
        dob: dob,
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

  const getProfileCompletion = () => {
    let pct = 0;
    if (fullName) pct += 25;
    if (user?.photoURL) pct += 25;
    if (dob) pct += 25;
    if (phoneNumber) pct += 25;
    return pct;
  };
  const completionPct = getProfileCompletion();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Futuristic Header with Background Glow */}
        <div className="relative p-6 rounded-3xl border border-border/60 bg-gradient-to-r from-card/80 to-card/20 backdrop-blur-md overflow-hidden shadow-sm">
          {/* Neon mesh background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-patr-orange/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-patr-orange/20 text-patr-orange border border-patr-orange/30">
                  Mera Khata
                </span>
                <span className="text-xs text-muted-foreground font-semibold">• Active User</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-1.5 flex items-center gap-2">
                Account Profile Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apne personal details aur security verification ko customize karein</p>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold bg-background/50 border border-border/60 rounded-xl px-4 py-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Account: <span className="text-emerald-500 font-bold">Verified India 🇮🇳</span>
            </div>
          </div>
        </div>

        {/* Profile Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Avatar and quick info Card (Identity Card) */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            <div className="border border-border/60 rounded-3xl bg-card/40 backdrop-blur p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-gradient-to-b from-patr-orange/[0.03] to-transparent pointer-events-none" />

              <div className="relative group w-28 h-28 mb-5 select-none">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-patr-orange/20 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-patr-orange to-[#FF8C60] flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-patr-orange/20 relative">
                    {getInitials(user.displayName)}
                  </div>
                )}
                {/* Hover Camera Icon Overlay */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-bold">
                  <Camera className="w-6 h-6 mb-1 text-patr-orange" />
                  Change DP
                  <input
                    type="file"
                    aria-label="Upload Avatar"
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
              
              {/* Copyable Address chip */}
              <div 
                onClick={() => {
                  navigator.clipboard.writeText(user.patrAddress);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-mono font-semibold text-muted-foreground mt-1.5 cursor-pointer border border-border/40 select-all select-none transition-colors active:scale-95 animate-fade-in"
              >
                <span>{user.patrAddress}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> : <Copy className="w-3 h-3 text-muted-foreground/60" />}
              </div>
              
              <div className="w-full border-t border-border/40 my-6" />

              {/* Profile Completion Meter */}
              <div className="w-full space-y-2 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Profile Completion</span>
                  <span className="font-bold text-patr-orange">{completionPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-patr-orange to-[#FF8C60] rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/85 leading-relaxed pt-1 font-semibold">
                  Apne details aur Date of Birth update karke security level badhayein!
                </p>
              </div>
            </div>

            {/* Storage Progress Card */}
            <div className="border border-border/60 rounded-3xl bg-card/40 backdrop-blur p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-patr-orange/10 border border-patr-orange/20">
                  <HardDrive className="w-5 h-5 text-patr-orange" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Storage Status</h3>
                  <p className="text-[10px] text-muted-foreground">Universal free storage</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>0.1 MB Used</span>
                  <span>5.0 GB Free (100%)</span>
                </div>
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="w-[1%] h-full bg-patr-orange rounded-full" />
                </div>
                <p className="text-[10px] text-muted-foreground pt-1.5 leading-relaxed font-semibold">
                  Patr mail par aapko hamesha ke liye 5GB safe cloud storage free milta hai! 🇮🇳
                </p>
              </div>
            </div>
          </div>

          {/* Form details Redesign */}
          <div className="lg:col-span-2 border border-border/60 rounded-3xl bg-card/40 backdrop-blur p-8 shadow-sm flex flex-col justify-between">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* ALERTS */}
              {success && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in font-semibold">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Profile successfully update ho gayi hai! 🎉</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-patr-orange uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Personal Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                      placeholder="Apna Pura Naam Likhye"
                      disabled={loading}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background/30 text-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm [color-scheme:light] dark:[color-scheme:dark]"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Contact Info */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-patr-orange uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Address & Recovery
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patr Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Patr Address
                    </label>
                    <input
                      type="text"
                      value={user.patrAddress}
                      disabled
                      className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-muted-foreground cursor-not-allowed text-sm font-mono"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Recovery Phone
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                      placeholder="+91 XXXXX XXXXX"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Metadata */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-patr-orange uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Security Metadata
                </h3>

                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date Joined
                  </label>
                  <div className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-muted-foreground flex items-center text-sm">
                    {formattedDate}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end border-t border-border/30">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-patr-orange/20"
                >
                  <Save className="w-4.5 h-4.5" />
                  {loading ? 'Saving...' : 'Changes Save Karo'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>


      {/* Elegant Crop Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card/95 p-6 backdrop-blur shadow-2xl space-y-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <h3 className="text-sm font-bold text-foreground">Adjust & Crop Photo ✂️</h3>
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
            
            {/* Cropper Container */}
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black/50 border border-border/40">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-muted accent-patr-orange cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="flex-1 h-11 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={uploading}
                className="flex-1 h-11 rounded-xl bg-patr-orange hover:bg-[#E55A25] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin animate-spin-slow" />
                    Saving...
                  </>
                ) : (
                  'Crop & Save Karo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
