import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export interface MultiAccount {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  passwordBase64: string;
}

/**
 * Encode a string to base64 safely
 */
export function encodePassword(password: string): string {
  try {
    return btoa(password);
  } catch (e) {
    return password;
  }
}

/**
 * Decode a base64 string safely
 */
export function decodePassword(encoded: string): string {
  try {
    return atob(encoded);
  } catch (e) {
    return encoded;
  }
}

/**
 * Fetch list of all logged in accounts from localStorage
 */
export function getAccountsList(): MultiAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('patr_multi_accounts');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing multi accounts:', e);
    return [];
  }
}

/**
 * Save an account to the multi accounts list in localStorage
 */
export function saveAccount(account: MultiAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAccountsList();
    const index = list.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    
    if (index > -1) {
      list[index] = account; // Update details
    } else {
      list.push(account); // Add new account
    }
    
    localStorage.setItem('patr_multi_accounts', JSON.stringify(list));
    localStorage.setItem('patr_active_email', account.email);
  } catch (e) {
    console.error('Error saving multi account:', e);
  }
}

/**
 * Remove an account from the multi accounts list
 */
export function removeAccount(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAccountsList();
    const updated = list.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem('patr_multi_accounts', JSON.stringify(updated));
    
    const activeEmail = localStorage.getItem('patr_active_email');
    if (activeEmail?.toLowerCase() === email.toLowerCase()) {
      if (updated.length > 0) {
        localStorage.setItem('patr_active_email', updated[0].email);
      } else {
        localStorage.removeItem('patr_active_email');
      }
    }
  } catch (e) {
    console.error('Error removing multi account:', e);
  }
}

/**
 * Clear all accounts from multi-account switcher
 */
export function clearAllAccounts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('patr_multi_accounts');
    localStorage.removeItem('patr_active_email');
  } catch (e) {
    console.error('Error clearing multi accounts:', e);
  }
}

/**
 * Perform a session switch to the selected account email
 */
export async function switchAccount(
  email: string,
  onStart: () => void,
  onSuccess: () => void,
  onError: (err: string) => void
): Promise<void> {
  onStart();
  try {
    const list = getAccountsList();
    const account = list.find((a) => a.email.toLowerCase() === email.toLowerCase());
    
    if (!account) {
      throw new Error('Account credentials not found in cache.');
    }
    
    const plainPassword = decodePassword(account.passwordBase64);
    
    // Sign into new session directly (Firebase Auth automatically handles signing out the previous user session)
    const userCredential = await signInWithEmailAndPassword(auth, email, plainPassword);
    
    if (userCredential.user) {
      localStorage.setItem('patr_active_email', email);
      onSuccess();
    } else {
      throw new Error('Failed to login switched account.');
    }
  } catch (err: any) {
    console.error('Error switching accounts:', err);
    let message = 'Account badalne mein dikkat aayi.';
    if (err.code === 'auth/wrong-password') {
      message = 'Saved credentials updated elsewhere. Kripya naye sire se login karein.';
    }
    onError(message);
  }
}
