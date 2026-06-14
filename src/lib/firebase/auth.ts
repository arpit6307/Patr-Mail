import { auth } from '@/lib/firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
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
