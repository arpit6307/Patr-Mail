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
  signature?: string;
  vacationResponderEnabled?: boolean;
  vacationSubject?: string;
  vacationMessage?: string;
  dob?: string;
  labels?: { name: string; color: string }[];
}


