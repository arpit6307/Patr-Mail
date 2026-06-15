'use client';

import { useState, useRef, useEffect } from 'react';
import { Key, Lock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateUserDoc } from '@/lib/firebase/firestore';

export function IdentityPINSetup() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [confirmPinDigits, setConfirmPinDigits] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const enterRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const confirmRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const isPinSet = user?.securityPinSet || false;

  useEffect(() => {
    if (step === 'enter' && !isPinSet) {
      enterRefs[0].current?.focus();
    } else if (step === 'confirm') {
      confirmRefs[0].current?.focus();
    }
  }, [step, isPinSet]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    
    if (isConfirm) {
      const newDigits = [...confirmPinDigits];
      newDigits[index] = numericValue;
      setConfirmPinDigits(newDigits);
      
      if (numericValue && index < 3) {
        confirmRefs[index + 1].current?.focus();
      }
    } else {
      const newDigits = [...pinDigits];
      newDigits[index] = numericValue;
      setPinDigits(newDigits);
      
      if (numericValue && index < 3) {
        enterRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    if (e.key === 'Backspace') {
      const currentDigits = isConfirm ? confirmPinDigits : pinDigits;
      
      if (!currentDigits[index] && index > 0) {
        const refs = isConfirm ? confirmRefs : enterRefs;
        refs[index - 1].current?.focus();
      }
    }
  };

  const handleSetPIN = async () => {
    const pin = pinDigits.join('');
    
    if (pin.length !== 4) {
      setError('4-digit PIN enter karein');
      return;
    }

    if (step === 'enter') {
      setStep('confirm');
      setError(null);
      return;
    }

    // Confirm step
    const confirmPin = confirmPinDigits.join('');
    
    if (confirmPin.length !== 4) {
      setError('4-digit PIN confirm karein');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs match nahi ho rahe. Dobara try karein.');
      setPinDigits(['', '', '', '']);
      setConfirmPinDigits(['', '', '', '']);
      setStep('enter');
      enterRefs[0].current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save PIN in Firestore
      await updateUserDoc(user!.uid, {
        securityPin: pin,
        securityPinSet: true,
      });

      // Update local state
      const updatedUser = {
        ...user!,
        securityPin: pin,
        securityPinSet: true,
      };
      setUser(updatedUser);
      localStorage.setItem(`patr_user_${user!.uid}`, JSON.stringify(updatedUser));

      // Also save in localStorage for quick access
      localStorage.setItem('patr_security_pin', pin);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('PIN save error:', err);
      setError('PIN save karne mein dikkat aayi.');
    } finally {
      setLoading(false);
    }
  };

  if (isPinSet) {
    return (
      <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Identity Verification PIN</h3>
            <p className="text-xs text-muted-foreground">Security PIN successfully set hai</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-500">
            <Shield className="w-4 h-4" />
            <p className="text-xs font-semibold">
              Aapka 4-digit security PIN set ho chuka hai aur Digital Footprint Map mein use ho raha hai.
            </p>
          </div>
          <p className="text-xs text-emerald-500/70 mt-2 font-semibold">
            ⚠️ <strong>One-time setup:</strong> PIN ko change nahi kar sakte. Security ke liye yaad rakhein!
          </p>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Current PIN:</strong> <span className="font-mono text-patr-orange">••••</span> (hidden for security)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-2xl bg-card/40 backdrop-blur p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-patr-orange/10 border border-patr-orange/20">
          <Key className="w-5 h-5 text-patr-orange" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Identity Verification PIN</h3>
          <p className="text-xs text-muted-foreground">
            {step === 'enter' ? 'Digital Footprint Map ke liye 4-digit PIN set karein' : 'PIN confirm karein'}
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-2 text-blue-400">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">
              Yeh PIN aapke Digital Footprint Map ko protect karega. 
            </p>
            <p className="text-blue-400/70">
              Connected devices aur apps ko revoke karte waqt yeh PIN verify karna hoga.
            </p>
            <p className="text-blue-400/70 font-bold mt-2">
              ⚠️ <strong>Important:</strong> Yeh PIN sirf <strong>ek baar</strong> set ho sakta hai. Baad mein change nahi kar sakte!
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">PIN successfully set ho gaya! 🎉</span>
        </div>
      )}

      {/* PIN Input */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-foreground/80">
          {step === 'enter' ? 'Enter 4-Digit PIN' : 'Confirm 4-Digit PIN'}
        </label>
        
        <div className="flex gap-3 justify-center">
          {(step === 'enter' ? pinDigits : confirmPinDigits).map((digit, index) => (
            <input
              key={index}
              ref={step === 'enter' ? enterRefs[index] : confirmRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value, step === 'confirm')}
              onKeyDown={(e) => handleKeyDown(index, e, step === 'confirm')}
              className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-patr-orange focus:border-patr-orange transition-all"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {step === 'confirm' && (
          <button
            type="button"
            onClick={() => {
              setStep('enter');
              setConfirmPinDigits(['', '', '', '']);
              setError(null);
            }}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-border bg-background/30 text-foreground font-semibold text-sm hover:bg-muted/40 transition-all disabled:opacity-50"
          >
            Peeche Jao
          </button>
        )}
        <button
          type="button"
          onClick={handleSetPIN}
          disabled={loading || (step === 'enter' ? pinDigits.some(d => !d) : confirmPinDigits.some(d => !d))}
          className="flex-1 h-11 rounded-xl bg-patr-orange text-white font-semibold text-sm hover:bg-[#E55A25] transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : step === 'enter' ? (
            'Aage Badho'
          ) : (
            'PIN Set Karo'
          )}
        </button>
      </div>
    </div>
  );
}
