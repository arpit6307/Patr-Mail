'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  registerStep4Schema,
} from '@/lib/validations/auth';
import { OTPInput } from '@/components/auth/OTPInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { registerUser } from '@/lib/firebase/auth';
import { createUserDoc, userExistsByEmail } from '@/lib/firebase/firestore';

const steps = [
  { label: 'ID Banao' },
  { label: 'Mobile No' },
  { label: 'Verify' },
  { label: 'Password' },
];

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  // Real-time username availability check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Form values accumulated across steps
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone: '',
    otp: '',
    password: '',
  });

  // Step 1 Form
  const {
    register: reg1,
    handleSubmit: handleS1,
    watch: watch1,
    formState: { errors: errors1 },
  } = useForm({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { username: formData.username, name: formData.name },
  });

  // Step 2 Form
  const {
    register: reg2,
    handleSubmit: handleS2,
    formState: { errors: errors2 },
  } = useForm({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { phone: formData.phone },
  });

  // Step 4 Form
  const {
    register: reg4,
    handleSubmit: handleS4,
    watch: watch4,
    formState: { errors: errors4 },
  } = useForm({
    resolver: zodResolver(registerStep4Schema),
    defaultValues: { password: formData.password, confirmPassword: '' },
  });

  const usernameVal = watch1('username');
  const watchPassword = watch4('password');

  // Debounced username availability check
  useEffect(() => {
    if (step !== 1) return;
    
    if (!usernameVal || usernameVal.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const taken = await userExistsByEmail(`${usernameVal.trim()}@patr.in`);
        if (step === 1) {
          setUsernameStatus(taken ? 'taken' : 'available');
        }
      } catch (err) {
        console.error('Error checking username:', err);
        if (step === 1) {
          setUsernameStatus('idle');
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameVal, step]);

  const onStep1Submit = (data: { username: string; name: string }) => {
    if (usernameStatus !== 'available') return;
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
    setError(null);
  };

  const onStep2Submit = async (data: { phone: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone, type: 'register' }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'OTP bhejne mein dikkat aayi');
      }
      
      // For development, if OTP is returned, auto-log or let the user know
      if (resData.otp) {
        console.log('DEV ONLY OTP:', resData.otp);
        setDevOtp(resData.otp);
      } else {
        setDevOtp(null);
      }

      setFormData((prev) => ({ ...prev, phone: data.phone }));
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (formData.otp.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formData.phone, code: formData.otp }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Galat OTP');
      }
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onStep4Submit = async (data: any) => {
    setLoading(true);
    setError(null);
    const email = `${formData.username.trim()}@patr.in`;
    
    try {
      const { user, error: regError } = await registerUser(email, data.password, formData.name);
      if (regError) {
        throw new Error(regError);
      }
      if (user) {
        await createUserDoc(user.uid, {
          uid: user.uid,
          email,
          displayName: formData.name,
          patrAddress: email,
        });
        router.push('/inbox');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
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

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Steps Content */}
      <AnimatePresence mode="wait">
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
                <p className="text-xs text-red-400 mt-1">Yeh Patr ID kisi aur ne le li hai.</p>
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
                  className="w-full h-11 pl-12 pr-4 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                  disabled={loading}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">Verification ke liye ek OTP bheja jayega.</p>
              {errors2.phone && (
                <p className="text-xs text-red-400 mt-1">{errors2.phone.message as string}</p>
              )}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    OTP Bhejo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <p className="text-sm text-white/70">OTP enter karein jo +91 {formData.phone} par bheja hai</p>
              {devOtp && (
                <div className="mt-2 p-2 bg-patr-orange/10 border border-patr-orange/20 rounded-xl text-xs text-patr-orange font-mono font-bold animate-pulse inline-block mx-auto">
                  [Dev Helper] Aapka OTP hai: {devOtp}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <OTPInput
                length={6}
                value={formData.otp}
                onChange={(val) => setFormData((prev) => ({ ...prev, otp: val }))}
                disabled={loading}
              />
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
                type="button"
                onClick={verifyOTP}
                disabled={formData.otp.length !== 6 || loading}
                className="flex-1 h-11 rounded-xl bg-patr-orange text-white font-bold text-sm hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.form
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleS4(onStep4Submit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Password Banao</label>
              <input
                {...reg4('password')}
                type="password"
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                disabled={loading}
              />
              <PasswordStrength password={watchPassword} />
              {errors4.password && (
                <p className="text-xs text-red-400 mt-1">{errors4.password.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5 mt-4">
              <label className="text-xs font-semibold text-white/70">Password Confirm Karo</label>
              <input
                {...reg4('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
                disabled={loading}
              />
              {errors4.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors4.confirmPassword.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-patr-orange text-white font-bold text-sm shadow-lg shadow-patr-orange/20 hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
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
          </motion.form>
        )}
      </AnimatePresence>

      <p className="text-center text-xs text-white/40 pt-2">
        Pehle se account hai?{' '}
        <Link href="/login" className="text-patr-orange hover:underline font-semibold">
          Login Karo
        </Link>
      </p>
    </div>
  );
}
