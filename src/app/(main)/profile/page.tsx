'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserDoc } from '@/lib/firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase/config';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Camera,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Info,
  HelpCircle,
  Activity,
  Key,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

type ProfileTab = 'personal' | 'contact' | 'storage';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasSecurityPin, setHasSecurityPin] = useState(false);

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
      const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels, originalFileName);
      const { uploadAvatar } = await import('@/lib/firebase/storage');
      
      const photoURL = await uploadAvatar(user.uid, croppedFile);

      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { photoURL });
      }

      await updateUserDoc(user.uid, { photoURL });

      const updatedUser = {
        ...user,
        photoURL,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setCropImageSrc(null);
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
      setGender(user.gender || '');
      setBio(user.bio || '');
      setRecoveryEmail(user.recoveryEmail || '');
    }
    
    // Check security PIN existence
    if (typeof window !== 'undefined') {
      const pin = localStorage.getItem('patr_security_pin');
      setHasSecurityPin(!!pin);
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

  const handleSavePersonal = async (e: React.FormEvent) => {
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
      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, {
          displayName: fullName.trim(),
        });
      }

      const updatedData = {
        displayName: fullName.trim(),
        dob: dob,
        gender: gender,
        bio: bio,
      };
      await updateUserDoc(user.uid, updatedData);

      const updatedUser = {
        ...user,
        ...updatedData,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating personal profile:', err);
      setError('Profile update karne mein dikkat aayi. Kripya dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedData = {
        phoneNumber: phoneNumber.trim(),
        recoveryEmail: recoveryEmail.trim(),
      };
      await updateUserDoc(user.uid, updatedData);

      const updatedUser = {
        ...user,
        ...updatedData,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(updatedUser));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating contact profile:', err);
      setError('Contact info save karne mein dikkat aayi.');
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
    if (fullName.trim()) pct += 20;
    if (user?.photoURL) pct += 20;
    if (dob) pct += 20;
    if (phoneNumber.trim()) pct += 20;
    if (gender) pct += 10;
    if (bio.trim()) pct += 10;
    return pct;
  };
  
  const completionPct = getProfileCompletion();

  // SVG Radial Ring calculation
  const radius = 52;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius; // 326.72
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'contact', label: 'Contact & Recovery', icon: Mail },
    { id: 'storage', label: 'Storage & Status', icon: HardDrive },
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
                  Mera Khata
                </span>
                <span className="text-xs text-muted-foreground font-semibold">• Active Profile</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-1.5 flex items-center gap-2">
                Account Profile Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apne personal details aur verification status ko manage karein</p>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold bg-background/50 border border-border/60 rounded-xl px-4 py-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Account: <span className="text-emerald-500 font-bold">Verified India 🇮🇳</span>
            </div>
          </div>
        </div>

        {/* Premium Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Avatar Card & Navigation */}
          <div className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-20">
            
            {/* Identity Card with radial progress ring */}
            <div className="border border-border/60 rounded-3xl bg-card/40 backdrop-blur p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-gradient-to-b from-patr-orange/[0.03] to-transparent pointer-events-none" />

              {/* Glowing SVG Progress Ring */}
              <div className="relative w-36 h-36 mb-4 flex items-center justify-center select-none">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Outer circle shadow base */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-muted/30 dark:stroke-muted/10"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Animated Progress Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-patr-orange transition-all duration-700 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(255, 107, 53, 0.45))'
                    }}
                  />
                </svg>

                {/* Avatar uploader container inside */}
                <div className="relative group w-24 h-24 rounded-full overflow-hidden shadow-lg border border-border/40">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-patr-orange to-[#FF8C60] flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials(user.displayName)}
                    </div>
                  )}
                  {/* Hover Camera Icon Overlay */}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer text-[10px] font-bold">
                    <Camera className="w-5 h-5 mb-1 text-patr-orange" />
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
                      <Loader2 className="w-5 h-5 animate-spin text-patr-orange" />
                    </div>
                  )}
                </div>
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
              
              <div className="w-full border-t border-border/40 my-5" />

              {/* Profile Completion Checklist Summary */}
              <div className="w-full space-y-2 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground font-semibold">Profile Status</span>
                  <span className="font-bold text-patr-orange">{completionPct}% Complete</span>
                </div>
                
                {/* Micro Checklist indicator pills */}
                <div className="flex gap-1.5 justify-center py-1">
                  <div className={cn("h-1.5 flex-1 rounded-full", fullName.trim() ? "bg-patr-orange" : "bg-muted")} />
                  <div className={cn("h-1.5 flex-1 rounded-full", user.photoURL ? "bg-patr-orange" : "bg-muted")} />
                  <div className={cn("h-1.5 flex-1 rounded-full", dob ? "bg-patr-orange" : "bg-muted")} />
                  <div className={cn("h-1.5 flex-1 rounded-full", phoneNumber.trim() ? "bg-patr-orange" : "bg-muted")} />
                  <div className={cn("h-1.5 flex-1 rounded-full", gender || bio.trim() ? "bg-patr-orange" : "bg-muted")} />
                </div>
                
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed pt-1.5 font-semibold text-center">
                  Apna photo aur recovery info set karke account safe aur complete rakhein!
                </p>
              </div>
            </div>

            {/* Sidebar Tab Navigation */}
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-border/40 select-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                    }}
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

          </div>

          {/* Right Column: Tab Contents */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Alerts */}
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in font-semibold">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Profile info successfully update ho gayi hai! 🎉</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PERSONAL INFO TAB */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal} className="space-y-6">
                
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Personal Information</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apna public name, date of birth aur basic information set karein</p>
                  </div>
                  
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
                        placeholder="Apna Pura Naam Likhein"
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

                  {/* Gender Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" /> Gender
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['male', 'female', 'other', 'none'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={cn(
                            "h-11 rounded-xl border text-xs font-bold transition-all capitalize flex items-center justify-center gap-1.5",
                            gender === g
                              ? "border-patr-orange bg-patr-orange/5 text-patr-orange font-bold ring-2 ring-patr-orange/20"
                              : "border-border bg-background/30 text-muted-foreground hover:bg-muted/40 font-semibold"
                          )}
                        >
                          {g === 'male' && 'Male 👨'}
                          {g === 'female' && 'Female 👩'}
                          {g === 'other' && 'Other 🌈'}
                          {g === 'none' && 'Secret 🤫'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal Bio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-muted-foreground" /> Personal Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={160}
                      className="w-full p-4 rounded-xl border border-border bg-background/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm font-sans resize-none"
                      placeholder="Apne baare mein thoda likhein (e.g. Creator, Developer, Writer...)"
                      disabled={loading}
                    />
                    <div className="flex justify-end text-[10px] text-muted-foreground font-semibold">
                      {bio.length}/160 characters
                    </div>
                  </div>

                </div>

                <div className="flex justify-end">
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
            )}

            {/* CONTACT & RECOVERY TAB */}
            {activeTab === 'contact' && (
              <form onSubmit={handleSaveContact} className="space-y-6">
                
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Contact & Recovery Options</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apni recovery details aur communication options update karein</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patr Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Primary Patr Address
                      </label>
                      <input
                        type="text"
                        value={user.patrAddress}
                        disabled
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-muted-foreground cursor-not-allowed text-sm font-mono"
                      />
                    </div>

                    {/* Login Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Login Email ID
                      </label>
                      <input
                        type="text"
                        value={user.email}
                        disabled
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-muted-foreground cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recovery Phone */}
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

                    {/* Recovery Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Recovery Email
                      </label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                        placeholder="recovery@example.com"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Save className="w-4.5 h-4.5" />
                    {loading ? 'Saving...' : 'Contact Info Save Karo'}
                  </button>
                </div>

              </form>
            )}

            {/* STORAGE & STATUS TAB */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                
                {/* Storage Health */}
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-patr-orange/10 border border-patr-orange/20">
                      <HardDrive className="w-5 h-5 text-patr-orange" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Storage Allocation</h3>
                      <p className="text-xs text-muted-foreground">Universal free storage status</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>0.1 MB Used</span>
                      <span>5.0 GB Total Free (100%)</span>
                    </div>
                    <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden relative shadow-inner">
                      <div className="w-[1%] h-full bg-gradient-to-r from-patr-orange to-[#FF8C60] rounded-full animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                      Patr mail accounts ko security, scale aur swift delivery ke liye optimized 5GB high-speed cloud storage free milta hai. 🇮🇳
                    </p>
                  </div>
                </div>

                {/* Account Health & Security Checklist */}
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-patr-orange" />
                    <h3 className="text-sm font-bold text-foreground">Account Health Checklist</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Item 1: Display Name */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/20">
                      {user.displayName ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block">Display Name</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {user.displayName ? 'Name successfully set' : 'Apna naam enter karein'}
                        </span>
                      </div>
                    </div>

                    {/* Item 2: Profile Photo */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/20">
                      {user.photoURL ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block">Profile Avatar</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {user.photoURL ? 'Avatar uploaded' : 'DP upload karein'}
                        </span>
                      </div>
                    </div>

                    {/* Item 3: Phone linked */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/20">
                      {user.phoneNumber ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block">Recovery Phone</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {user.phoneNumber ? 'Phone number linked' : 'Phone verify karein'}
                        </span>
                      </div>
                    </div>

                    {/* Item 4: Security PIN */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/20">
                      {hasSecurityPin ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block">Identity Verification PIN</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {hasSecurityPin ? 'PIN successfully configured' : 'Setting Page par PIN set karein'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Metadata Details */}
                <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-xs font-bold text-patr-orange uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Security Metadata
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Date Joined</label>
                      <div className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-muted-foreground flex items-center text-sm font-semibold select-none">
                        {formattedDate}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Account Status</label>
                      <div className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 text-emerald-500 flex items-center text-sm font-bold select-none">
                        Active & Secured
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
