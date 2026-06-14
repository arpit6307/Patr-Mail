import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username kam se kam 3 characters ka hona chahiye')
    .max(20, 'Username max 20 characters ka ho sakta hai')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username mein sirf letters, numbers, dot aur underscore use karein'),
  password: z
    .string()
    .min(8, 'Password kam se kam 8 characters ka hona chahiye'),
});

export const registerStep1Schema = z.object({
  username: z
    .string()
    .min(3, 'Username kam se kam 3 characters ka hona chahiye')
    .max(20, 'Username max 20 characters ka ho sakta hai')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username mein sirf letters, numbers, dot aur underscore use karein'),
  name: z
    .string()
    .min(2, 'Name kam se kam 2 characters ka hona chahiye')
    .max(50, 'Name max 50 characters ka ho sakta hai'),
});

export const registerStep2Schema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Kripya ek valid 10-digit mobile number enter karein'),
});

export const registerStep3Schema = z.object({
  otp: z
    .string()
    .length(6, 'OTP 6-digit ka hona chahiye'),
});

export const registerStep4Schema = z.object({
  password: z
    .string()
    .min(8, 'Password kam se kam 8 characters ka hona chahiye')
    .regex(/[A-Z]/, 'Ek capital letter (A-Z) hona zaroori hai')
    .regex(/[a-z]/, 'Ek small letter (a-z) hona zaroori hai')
    .regex(/[0-9]/, 'Ek number (0-9) hona zaroori hai')
    .regex(/[^A-Za-z0-9]/, 'Ek special character (e.g. @, $, !, %) hona zaroori hai'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords match nahi kar rahe hain',
  path: ['confirmPassword'],
});
