'use client';

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';
import { motion } from 'framer-motion';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clamped]?.focus();
    },
    [length],
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d?$/.test(char)) return;

      const arr = digits.slice();
      arr[index] = char;
      const next = arr.join('');
      onChange(next);

      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, onChange, length, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (digits[index]) {
          handleChange(index, '');
        } else if (index > 0) {
          handleChange(index - 1, '');
          focusInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, handleChange, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text/plain')
        .replace(/\D/g, '')
        .slice(0, length);

      if (pasted.length > 0) {
        onChange(pasted.padEnd(length, '').slice(0, length).replace(/ /g, ''));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange, focusInput],
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, i) => (
        <motion.input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoComplete="one-time-code"
          aria-label={`OTP digit ${i + 1}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          onChange={(e) => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`
            h-12 w-10 sm:h-14 sm:w-12
            rounded-xl border-2 bg-white/[0.06]
            text-center text-xl sm:text-2xl font-bold text-white
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-patr-orange/50
            disabled:opacity-40 disabled:cursor-not-allowed
            ${
              digit
                ? 'border-patr-orange/60 shadow-[0_0_12px_rgba(255,107,53,0.15)]'
                : 'border-white/[0.1] hover:border-white/20'
            }
          `}
        />
      ))}
    </div>
  );
}
