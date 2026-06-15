'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { loginSchema } from '@/lib/validations/auth';
import { loginUser } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types/user';

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    const email = `${data.username.trim()}@patr.in`;
    
    const { user, error: loginError } = await loginUser(email, data.password);
    
    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else if (user) {
      try {
        // Fetch user document immediately from Firestore to populate the cache
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          
          // Save account in multi-account list
          const { saveAccount, encodePassword } = await import('@/lib/multiAccount');
          saveAccount({
            uid: user.uid,
            email: email,
            passwordBase64: encodePassword(data.password),
            name: userData.displayName || user.displayName || 'User',
            photoURL: userData.photoURL || user.photoURL || '',
          });

          // Cache it in localStorage
          localStorage.setItem(`patr_user_${user.uid}`, JSON.stringify(userData));
          // Set user in Zustand store instantly to make transition seamless
          setUser(userData);
        }
      } catch (err) {
        console.error('Error pre-caching user details:', err);
      }
      router.push('/inbox');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-white/70">Patr ID</label>
        <div className="relative flex items-center">
          <input
            {...register('username')}
            type="text"
            placeholder="arpit"
            className="w-full h-11 pl-4 pr-20 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
            disabled={loading}
          />
          <span className="absolute right-4 text-sm font-semibold text-white/40 select-none">
            @patr.in
          </span>
        </div>
        {errors.username && (
          <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-white/70">Password</label>
          <Link
            href="/reset-password"
            className="text-xs text-patr-orange hover:underline"
          >
            Password Bhool Gaye?
          </Link>
        </div>
        <div className="relative flex items-center">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-patr-orange transition-shadow text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-white/40 hover:text-white/70 transition-colors"
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-patr-orange text-white font-bold text-sm shadow-lg shadow-patr-orange/20 hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          'Login Karo 🚀'
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-xs text-white/40 pt-2">
        Naya account chahiye?{' '}
        <Link href="/register" className="text-patr-orange hover:underline font-semibold">
          Naya Patr ID Banao
        </Link>
      </p>
    </form>
  );
}
