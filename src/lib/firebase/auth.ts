import { auth } from '@/lib/firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
  type ConfirmationResult,
} from 'firebase/auth';

/**
 * Log in a user with their email and password
 */
export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Login error:', error);
    let message = 'Login karne mein dikkat aayi. Kripya details check karein.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Email ya password galat hai.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email ID invalid hai.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many attempts. Kripya thodi der baad try karein.';
    }
    return { user: null, error: message };
  }
}

/**
 * Register a new user with their email and password
 */
export async function registerUser(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: name,
    });
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Registration error:', error);
    let message = 'Account banane mein dikkat aayi.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Yeh email already registered hai.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password bahut kamzor hai (kam se kam 6 characters chahiye).';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email ID invalid hai.';
    }
    return { user: null, error: message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Password reset error:', error);
    let message = 'Password reset mail bhejne mein dikkat aayi.';
    if (error.code === 'auth/user-not-found') {
      message = 'Yeh email ID registered nahi hai.';
    }
    return { success: false, error: message };
  }
}

/**
 * Sign out the current user
 */
export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Sign out karne mein dikkat aayi.' };
  }
}

/**
 * Phone Authentication - Setup reCAPTCHA verifier
 * @param containerId - HTML element ID jahan reCAPTCHA render hoga
 * @param isInvisible - Invisible reCAPTCHA use karna hai ya nahi (default: true)
 */
export function setupRecaptcha(containerId: string, isInvisible: boolean = true): RecaptchaVerifier {
  try {
    // Pehle se existing verifier ko clear karen
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: isInvisible ? 'invisible' : 'normal',
      callback: () => {
        // reCAPTCHA solved - OTP bhej sakte hain
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });

    // Global reference save karen
    (window as any).recaptchaVerifier = recaptchaVerifier;
    
    return recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA setup error:', error);
    throw error;
  }
}

/**
 * Phone number par OTP bhejein
 * @param phoneNumber - Format: +91XXXXXXXXXX (country code ke saath)
 * @param recaptchaVerifier - reCAPTCHA verifier instance
 */
export async function sendOTPToPhone(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  try {
    // Phone number format validate karen
    if (!phoneNumber.startsWith('+')) {
      return { 
        confirmationResult: null, 
        error: 'Phone number country code ke saath hona chahiye (e.g., +919876543210)' 
      };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    console.log('OTP sent successfully to:', phoneNumber);
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error('OTP send error:', error);
    
    let message = 'OTP bhejne mein dikkat aayi. Kripya phir se try karein.';
    
    if (error.code === 'auth/invalid-phone-number') {
      message = 'Phone number galat hai. Kripya sahi number enter karein.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Bahut saare attempts ho gaye. Kripya thodi der baad try karein.';
    } else if (error.code === 'auth/quota-exceeded') {
      message = 'SMS quota khatam ho gaya. Kripya admin se contact karein.';
    } else if (error.code === 'auth/captcha-check-failed') {
      message = 'reCAPTCHA verification fail ho gayi. Page reload karke phir try karein.';
    }
    
    return { confirmationResult: null, error: message };
  }
}

/**
 * OTP verify karke user ko login karen
 * @param confirmationResult - sendOTPToPhone se mila result
 * @param otp - User ne jo 6-digit code enter kiya
 */
export async function verifyOTP(confirmationResult: ConfirmationResult, otp: string) {
  try {
    const result = await confirmationResult.confirm(otp);
    console.log('OTP verified successfully, user:', result.user.uid);
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    
    let message = 'OTP verify karne mein dikkat aayi.';
    
    if (error.code === 'auth/invalid-verification-code') {
      message = 'Galat OTP code. Kripya phir se enter karein.';
    } else if (error.code === 'auth/code-expired') {
      message = 'OTP code expire ho gaya. Naya OTP request karein.';
    }
    
    return { user: null, error: message };
  }
}

/**
 * Existing email account ko phone number se link karen
 * @param phoneNumber - Format: +91XXXXXXXXXX
 * @param recaptchaVerifier - reCAPTCHA verifier
 */
export async function linkPhoneToAccount(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Pehle login karein.' };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error('Link phone error:', error);
    
    let message = 'Phone number link karne mein dikkat aayi.';
    
    if (error.code === 'auth/provider-already-linked') {
      message = 'Yeh phone number pehle se linked hai.';
    } else if (error.code === 'auth/invalid-phone-number') {
      message = 'Phone number galat hai.';
    }
    
    return { confirmationResult: null, error: message };
  }
}

/**
 * OTP verify karke phone number ko account se link karen
 */
export async function confirmLinkPhone(confirmationResult: ConfirmationResult, otp: string) {
  try {
    const result = await confirmationResult.confirm(otp);
    console.log('Phone linked successfully');
    
    return { success: true, user: result.user, error: null };
  } catch (error: any) {
    console.error('Confirm link error:', error);
    
    let message = 'Phone number link confirm karne mein dikkat aayi.';
    
    if (error.code === 'auth/invalid-verification-code') {
      message = 'Galat OTP code.';
    } else if (error.code === 'auth/credential-already-in-use') {
      message = 'Yeh phone number kisi aur account se linked hai.';
    }
    
    return { success: false, user: null, error: message };
  }
}
