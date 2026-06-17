'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Check, X, ArrowRight, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { z } from 'zod';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { createUserDoc, userExistsByEmail, userExistsByPhone } from '@/lib/firebase/firestore';
import { registerUser } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user';

// 3-step registration schema
const step1Schema = z.object({
  username: z.string().min(3, 'Username kamse kam 3 characters ka hona chahiye').max(20),
  name: z.string().min(2, 'Naam kamse kam 2 characters ka hona chahiye'),
  dob: z.string().min(1, 'Date of birth zaroori hai'),
});

const step2Schema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number 10 digits ka hona chahiye'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Terms & Conditions accept karna zaroori hai',
  }),
});

const step3Schema = z.object({
  password: z.string().min(6, 'Password kamse kam 6 characters ka hona chahiye'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords match nahi ho rahe',
  path: ['confirmPassword'],
});

const steps = [
  { label: 'ID Banao' },
  { label: 'Phone & Verify' },
  { label: 'Password' },
];

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time username availability check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Redirect target detection
  const [redirectUri, setRedirectUri] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const target = 
        urlParams.get('redirect_uri') || 
        urlParams.get('return_to') || 
        urlParams.get('redirect') || 
        urlParams.get('callbackUrl') || 
        urlParams.get('next') || 
        urlParams.get('continue');
      setRedirectUri(target);
    }
  }, []);

  const getButtonText = (url: string) => {
    try {
      if (url.startsWith('/')) {
        return 'Go Back to Patr';
      }
      const hostname = new URL(url).hostname;
      if (hostname.includes('indivibe')) return 'Go Back to IndiVibe';
      const parts = hostname.split('.');
      const firstPart = parts[0] === 'www' ? parts[1] : parts[0];
      if (firstPart) {
        return `Go Back to ${firstPart.charAt(0).toUpperCase() + firstPart.slice(1)}`;
      }
      return 'Go Back to App';
    } catch (e) {
      return 'Go Back to IndiVibe';
    }
  };

  const buttonText = redirectUri ? getButtonText(redirectUri) : '';

  // Form values
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    dob: '',
    phone: '',
    agreeTerms: false,
    password: '',
  });

  // Step 1 Form
  const {
    register: reg1,
    handleSubmit: handleS1,
    watch: watch1,
    setValue: setVal1,
    formState: { errors: errors1 },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { username: formData.username, name: formData.name, dob: formData.dob },
  });

  // Step 2 Form
  const {
    register: reg2,
    handleSubmit: handleS2,
    formState: { errors: errors2 },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { phone: formData.phone, agreeTerms: formData.agreeTerms },
  });

  // Step 3 Form
  const {
    register: reg3,
    handleSubmit: handleS3,
    watch: watch3,
    formState: { errors: errors3 },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: { password: formData.password, confirmPassword: '' },
  });

  const usernameVal = watch1('username');
  const watchPassword = watch3('password');

  // Debounced username availability check
  useEffect(() => {
    if (step !== 1) return;
    
    if (!usernameVal || usernameVal.length < 3) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const taken = await userExistsByEmail(`${usernameVal.trim()}@patr.in`);
        if (step === 1) {
          setUsernameStatus(taken ? 'taken' : 'available');
          if (taken) {
            const base = usernameVal.trim().toLowerCase();
            const candidates = [
              `${base}${Math.floor(10 + Math.random() * 90)}`,
              `${base}2026`,
              `${base}in`,
              `${base}${Math.floor(10 + Math.random() * 90)}`,
              `${base}99`,
              `${base}88`,
              `${base}77`,
              `patr${base}`,
            ];
            const uniqueCandidates = Array.from(new Set(candidates)).filter(
              (c) => c.length >= 3 && c !== base
            );
            
            // Check availability in parallel
            const checkedCandidates = await Promise.all(
              uniqueCandidates.map(async (c) => {
                const isTaken = await userExistsByEmail(`${c}@patr.in`);
                return { candidate: c, isTaken };
              })
            );
            
            // Filter available, slice top 3
            const available = checkedCandidates
              .filter((c) => !c.isTaken)
              .map((c) => c.candidate)
              .slice(0, 3);
              
            setSuggestions(available);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Error checking username:', err);
        if (step === 1) {
          setUsernameStatus('idle');
          setSuggestions([]);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameVal, step]);

  const handleSelectSuggestion = (suggestedUsername: string) => {
    setVal1('username', suggestedUsername, { shouldValidate: true });
    setUsernameStatus('available');
    setSuggestions([]);
  };

  const onStep1Submit = (data: { username: string; name: string; dob: string }) => {
    if (usernameStatus !== 'available') return;
    
    // Age validation
    const birthDate = new Date(data.dob);
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
    
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
    setError(null);
  };

  const onStep2Submit = async (data: { phone: string; agreeTerms: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const exists = await userExistsByPhone(`+91${data.phone}`);
      if (exists) {
        setError('Yeh phone number pehle se kisi account ke sath registered hai.');
        setLoading(false);
        return;
      }
      setFormData((prev) => ({ ...prev, ...data }));
      setStep(3);
      setError(null);
    } catch (err) {
      console.error('Error checking phone number:', err);
      setError('Phone number check karne mein dikkat aayi. Kripya dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const onStep3Submit = async (data: any) => {
    setLoading(true);
    setError(null);
    const email = `${formData.username.trim()}@patr.in`;
    
    try {
      // Register user with email and password
      const { user, error: regError } = await registerUser(email, data.password, formData.name.trim());

      if (regError) {
        setError(regError);
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Account banane mein dikkat aayi.');
        setLoading(false);
        return;
      }

      // Create user document in Firestore
      const userData: User = {
        uid: user.uid,
        email,
        displayName: formData.name.trim(),
        patrAddress: email,
        dob: formData.dob,
        phoneNumber: `+91${formData.phone}`,
        phoneVerified: false,  // Not verified yet
        securityPinSet: false,  // PIN not set yet
        createdAt: new Date(),
      };
      await createUserDoc(user.uid, userData);
      
      // Save account in multi-account list
      const { saveAccount, encodePassword } = await import('@/lib/multiAccount');
      saveAccount({
        uid: user.uid,
        email: email,
        passwordBase64: encodePassword(data.password),
        name: formData.name.trim(),
        photoURL: '',
      });
      
      // Cache in localStorage
      localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(userData));
      setUser(userData);

      setLoading(false);
      setStep(4);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Account banane mein dikkat aayi.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex justify-between items-center px-2">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const active = step >= stepNum;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    active
                      ? 'bg-patr-orange text-white shadow-lg shadow-patr-orange/20'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {stepNum}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${active ? 'text-white' : 'text-white/30'}`}>
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-3.5 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 -translate-y-1/2 transition-colors duration-300 ${
                      step > stepNum ? 'bg-patr-orange' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Steps Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1: ID Banao */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleS1(onStep1Submit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Full Name</label>
              <input
                {...reg1('name')}
                type="text"
                placeholder="Arpit Kumar"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
              />
              {errors1.name && (
                <p className="text-xs text-red-400 mt-1">{errors1.name.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Date of Birth</label>
              <input
                {...reg1('dob')}
                type="date"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm [color-scheme:dark]"
              />
              {errors1.dob && (
                <p className="text-xs text-red-400 mt-1">{errors1.dob.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Patr ID Banao</label>
              <div className="relative flex items-center">
                <input
                  {...reg1('username')}
                  type="text"
                  placeholder="arpit"
                  className="w-full h-11 pl-4 pr-24 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                />
                <span className="absolute right-10 text-sm font-semibold text-white/40 select-none">
                  @patr.in
                </span>
                <div className="absolute right-4 flex items-center">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {usernameStatus === 'taken' && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              {usernameStatus === 'taken' && (
                <div className="space-y-2">
                  <p className="text-xs text-red-400 mt-1">Yeh Patr ID kisi aur ne le li hai.</p>
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-white/50 font-semibold">Suggested IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/5 hover:bg-patr-orange/20 border border-white/10 hover:border-patr-orange/50 text-white/80 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {usernameStatus === 'available' && (
                <p className="text-xs text-emerald-400 mt-1">Yeh Patr ID available hai! 🎉</p>
              )}
              {errors1.username && (
                <p className="text-xs text-red-400 mt-1">{errors1.username.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={usernameStatus !== 'available'}
              className="w-full h-11 rounded-xl bg-patr-orange text-white font-bold text-sm hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
              Aage Badho
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* STEP 2: Phone & Verification Checkbox */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleS2(onStep2Submit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Phone Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-semibold text-white/40 select-none">
                  +91
                </span>
                <input
                  {...reg2('phone')}
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full h-11 pl-12 pr-4 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                />
              </div>
              {errors2.phone && (
                <p className="text-xs text-red-400 mt-1">{errors2.phone.message as string}</p>
              )}
              <p className="text-[10px] text-white/40 mt-1">
                Recovery aur security ke liye phone number zaroori hai
              </p>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="space-y-2 mt-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  {...reg2('agreeTerms')}
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 text-patr-orange border-white/20 focus:ring-patr-orange rounded bg-white/5"
                />
                <span className="text-xs text-white/70 leading-relaxed">
                  Main confirm karta/karti hoon ki maine <Link href="/terms" className="text-patr-orange hover:underline font-semibold">Terms & Conditions</Link> aur <Link href="/privacy" className="text-patr-orange hover:underline font-semibold">Privacy Policy</Link> padh li hai aur accept karta/karti hoon.
                </span>
              </label>
              {errors2.agreeTerms && (
                <p className="text-xs text-red-400 mt-1">{errors2.agreeTerms.message as string}</p>
              )}
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-emerald-400 font-semibold">
                Aapki personal details end-to-end encrypted rahegi. Humara promise! 🔒
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/[0.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Peeche Jao
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-patr-orange text-white font-bold text-sm hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Aage Badho
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* STEP 3: Password */}
        {step === 3 && (
          <motion.form
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleS3(onStep3Submit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Password Banao</label>
              <div className="relative flex items-center">
                <input
                  {...reg3('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrength password={watchPassword} />
              {errors3.password && (
                <p className="text-xs text-red-400 mt-1">{errors3.password.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5 mt-4">
              <label className="text-xs font-semibold text-white/70">Password Confirm Karo</label>
              <div className="relative flex items-center">
                <input
                  {...reg3('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors3.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors3.confirmPassword.message as string}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/[0.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Peeche Jao
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-patr-orange text-white font-bold text-sm shadow-lg shadow-patr-orange/20 hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Account Banna Raha Hai...
                  </>
                ) : (
                  'Account Banao 🚀'
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Aapka Account Ready Hai! 🎉</h3>
              <p className="text-sm text-white/60">
                Congratulations, aapka naya Patr ID successfully ban gaya hai.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Display Name:</span>
                <span className="text-white font-semibold">{formData.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Patr ID Address:</span>
                <span className="text-patr-orange font-bold">{formData.username}@patr.in</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Phone Number:</span>
                <span className="text-white/80">+91 {formData.phone}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {redirectUri ? (
                <a
                  href={redirectUri}
                  className="inline-flex items-center justify-center gap-2 w-full bg-[#FFE834] text-[#111111] border-2 border-[#111111] px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[4px_4px_0px_#111111] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_#111111] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  &larr; {buttonText}
                </a>
              ) : (
                <button
                  onClick={() => router.push('/inbox')}
                  className="w-full h-11 rounded-xl bg-patr-orange text-white font-bold text-sm shadow-lg shadow-patr-orange/20 hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Inbox
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step < 4 && (
        <p className="text-center text-xs text-white/40 pt-2">
          Pehle se account hai?{' '}
          <Link href="/login" className="text-patr-orange hover:underline font-semibold">
            Login Karo
          </Link>
        </p>
      )}
    </div>
  );
}
