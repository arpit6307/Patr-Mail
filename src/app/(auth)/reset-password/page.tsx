'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { OTPInput } from '@/components/auth/OTPInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

// ─── Schemas ───────────────────────────────────────────────
const emailStepSchema = z.object({
  username: z
    .string()
    .min(3, 'Kam se kam 3 characters chahiye')
    .max(30, 'Zyada se zyada 30 characters')
    .regex(/^[a-zA-Z0-9._]+$/, 'Sirf letters, numbers, dot aur underscore'),
});

const passwordStepSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Kam se kam 8 characters chahiye')
      .regex(/[A-Z]/, 'Ek uppercase letter chahiye')
      .regex(/[0-9]/, 'Ek number chahiye'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords match nahi kar rahe',
    path: ['confirmPassword'],
  });

type EmailData = z.infer<typeof emailStepSchema>;
type PasswordData = z.infer<typeof passwordStepSchema>;

// ─── Step animation variants ───────────────────────────────
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

const STEPS = [
  { icon: Mail, label: 'Email' },
  { icon: ShieldCheck, label: 'OTP' },
  { icon: KeyRound, label: 'Naya Password' },
];

export default function ResetPasswordPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  // Step 1 form
  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { username: '' },
  });

  // Step 3 form
  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordStepSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const goForward = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => s - 1);
  }, []);

  // ── Step 1: Send OTP ────────────────────────────────────
  const handleSendOTP = async (data: EmailData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const email = `${data.username}@patr.in`;
      setSavedEmail(email);
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset' }),
      });
      if (!res.ok) throw new Error('OTP nahi bhej paaye');
      goForward();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kuch galat ho gaya');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Poora 6-digit OTP daalo');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // In production: verify OTP via backend
      await new Promise((r) => setTimeout(r, 800));
      goForward();
    } catch {
      setError('OTP galat hai, dobara try karo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────
  const handleResetPassword = async (data: PasswordData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // In production: call Firebase password reset
      console.log('Password reset for:', savedEmail, data.password);
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch {
      setError('Password reset nahi ho paaya');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
        >
          <ShieldCheck className="h-8 w-8 text-green-400" />
        </motion.div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Password Reset Ho Gaya! 🎉
        </h3>
        <p className="text-sm text-white/50 mb-6">
          Ab naye password se login karo
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-patr-orange px-6 text-sm font-semibold text-white transition-colors hover:bg-patr-orange-hover"
        >
          Login Karo
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Title ──────────────────────────────────────── */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">Password Bhool Gaye?</h2>
        <p className="mt-1.5 text-sm text-white/50">
          Koi baat nahi, hum help karenge 🔑
        </p>
      </div>

      {/* ── Step indicator ─────────────────────────────── */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? 'border-green-400 bg-green-400/20 text-green-400'
                    : isActive
                    ? 'border-patr-orange bg-patr-orange/20 text-patr-orange'
                    : 'border-white/20 text-white/30'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-colors duration-300 ${
                    isDone ? 'bg-green-400' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Steps ──────────────────────────────────────── */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* STEP 1: Email */}
        {step === 0 && (
          <motion.form
            key="email-step"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            onSubmit={emailForm.handleSubmit(handleSendOTP)}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Apna Patr Username
              </label>
              <div className="relative">
                <input
                  {...emailForm.register('username')}
                  placeholder="tumhara.naam"
                  className="form-input w-full rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 pr-24 focus:ring-patr-orange/50 focus:border-patr-orange/50"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30 select-none">
                  @patr.in
                </span>
              </div>
              {emailForm.formState.errors.username && (
                <p className="mt-1 text-xs text-red-400">
                  {emailForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-patr-orange font-semibold text-white transition-all hover:bg-patr-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'OTP Bhejo'
              )}
            </button>
          </motion.form>
        )}

        {/* STEP 2: OTP */}
        {step === 1 && (
          <motion.div
            key="otp-step"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="text-center">
              <p className="text-sm text-white/50">
                OTP bheja gaya <span className="text-patr-orange">{savedEmail}</span> pe
              </p>
            </div>
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={isSubmitting || otp.length !== 6}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-patr-orange font-semibold text-white transition-all hover:bg-patr-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verify Karo'
              )}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="flex w-full items-center justify-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Peeche Jao
            </button>
          </motion.div>
        )}

        {/* STEP 3: New Password */}
        {step === 2 && (
          <motion.form
            key="password-step"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            onSubmit={passwordForm.handleSubmit(handleResetPassword)}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Naya Password
              </label>
              <input
                {...passwordForm.register('password')}
                type="password"
                placeholder="••••••••"
                className="form-input w-full rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:ring-patr-orange/50 focus:border-patr-orange/50"
                autoFocus
              />
              {passwordForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
              <PasswordStrength password={passwordForm.watch('password')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Password Confirm Karo
              </label>
              <input
                {...passwordForm.register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="form-input w-full rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:ring-patr-orange/50 focus:border-patr-orange/50"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-patr-orange font-semibold text-white transition-all hover:bg-patr-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Password Reset Karo'
              )}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="flex w-full items-center justify-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Peeche Jao
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Footer link ────────────────────────────────── */}
      <p className="mt-6 text-center text-sm text-white/40">
        Yaad aa gaya?{' '}
        <Link
          href="/login"
          className="font-medium text-patr-orange hover:underline"
        >
          Login Karo
        </Link>
      </p>
    </div>
  );
}
