import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  patrAddress: string;     // e.g. arpit@patr.in
  createdAt: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  phoneNumber?: string;
  phoneVerified?: boolean;  // Phone verification status
  signature?: string;
  vacationResponderEnabled?: boolean;
  vacationSubject?: string;
  vacationMessage?: string;
  dob?: string;
  labels?: { name: string; color: string }[];
  recoveryEmail?: string;
  gender?: string;
  bio?: string;
  securityPin?: string;  // Digital Footprint PIN
  securityPinSet?: boolean;  // Whether PIN has been set (one-time only)
  storageLimit?: number;     // Custom storage limit in bytes (optional)
}



