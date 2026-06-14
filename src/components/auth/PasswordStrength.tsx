'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0–4
  label: string;
  color: string;
  bgColor: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', bgColor: '' };
  }

  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Clamp 0-4
  const clamped = Math.min(4, score);

  const levels: StrengthResult[] = [
    { score: 0, label: 'Bahut Kamzor', color: 'text-red-400', bgColor: 'bg-red-500' },
    { score: 1, label: 'Kamzor', color: 'text-red-400', bgColor: 'bg-red-500' },
    { score: 2, label: 'Theek-Thaak', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
    { score: 3, label: 'Acha', color: 'text-green-400', bgColor: 'bg-green-500' },
    { score: 4, label: 'Bahut Mazboot 💪', color: 'text-green-400', bgColor: 'bg-green-500' },
  ];

  return levels[clamped];
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-1.5">
      {/* ── Bar ──────────────────────────────────────── */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full bg-white/[0.08] overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: strength.score >= level ? '100%' : '0%',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`h-full rounded-full ${strength.bgColor}`}
            />
          </div>
        ))}
      </div>

      {/* ── Label ────────────────────────────────────── */}
      <motion.p
        key={strength.label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs font-medium ${strength.color}`}
      >
        {strength.label}
      </motion.p>
    </div>
  );
}
