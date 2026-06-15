'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firebaseConfig, db } from '@/lib/firebase/config';
import { getAccountsList, switchAccount, decodePassword } from '@/lib/multiAccount';
import { useAuthStore } from '@/store/authStore';
import { EmailItem } from '@/components/email/EmailItem';
import { Loader2, Mail, Users, RefreshCw, Layers } from 'lucide-react';
import type { MailboxEntry } from '@/types/email';

interface UnifiedMailboxEntry extends MailboxEntry {
  accountEmail: string;
  accountName: string;
}

export default function PrimaryInboxPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  
  const [emails, setEmails] = useState<UnifiedMailboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Account switching states
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState('');
  
  const [accounts, setAccounts] = useState<any[]>([]);

  const fetchUnifiedMailbox = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    const loggedInAccounts = getAccountsList();
    setAccounts(loggedInAccounts);

    if (loggedInAccounts.length === 0) {
      setEmails([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    let allEmails: UnifiedMailboxEntry[] = [];

    try {
      // Fetch mailbox from all logged in accounts in parallel
      const fetchPromises = loggedInAccounts.map(async (account) => {
        try {
          let tempDb;
          
          if (currentUser && account.uid === currentUser.uid) {
            // Current active account loads directly from the default db instance
            tempDb = db;
          } else {
            const appName = `patr_app_${account.uid}`;
            const apps = getApps();
            const app = apps.find((a) => a.name === appName) || initializeApp(firebaseConfig, appName);
            
            const tempAuth = getAuth(app);
            tempDb = getFirestore(app);
            
            // Sign in if not already signed in on this app instance
            if (!tempAuth.currentUser) {
              const password = decodePassword(account.passwordBase64);
              await signInWithEmailAndPassword(tempAuth, account.email, password);
            }
          }
 
          // Fetch inbox emails for this account
          const q = query(
            collection(tempDb, 'users', account.uid, 'mailbox'),
            where('folder', '==', 'inbox'),
            orderBy('receivedAt', 'desc'),
            limit(20)
          );
          
          const snap = await getDocs(q);
          const entries = snap.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              accountEmail: account.email,
              accountName: account.name,
            } as UnifiedMailboxEntry;
          });
          
          return entries;
        } catch (err) {
          console.error(`Error loading mailbox for ${account.email}:`, err);
          return []; // Fail silently for single account failures
        }
      });

      const results = await Promise.all(fetchPromises);
      allEmails = results.flat();

      // Sort merged email list by receivedAt timestamp descending
      const getMillis = (dateObj: any) => {
        if (!dateObj) return 0;
        if (typeof dateObj.toDate === 'function') return dateObj.toDate().getTime();
        if (typeof dateObj.seconds === 'number') return dateObj.seconds * 1000;
        return new Date(dateObj).getTime();
      };

      allEmails.sort((a, b) => getMillis(b.receivedAt) - getMillis(a.receivedAt));

      setEmails(allEmails);
    } catch (err) {
      console.error('Error fetching unified mailbox:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnifiedMailbox();
  }, [currentUser]);

  const handleEmailClick = async (emailEntry: UnifiedMailboxEntry) => {
    const targetEmail = emailEntry.accountEmail;
    const activeEmail = currentUser?.email;

    if (targetEmail.toLowerCase() !== activeEmail?.toLowerCase()) {
      setSwitchingEmail(targetEmail);
      
      await switchAccount(
        targetEmail,
        () => setIsSwitching(true),
        () => {
          // Redirect and reload page to clear all cache states
          router.push(`/email/${emailEntry.emailId}`);
          setTimeout(() => {
            window.location.reload();
          }, 100);
        },
        (err) => {
          setIsSwitching(false);
          alert(err);
        }
      );
    } else {
      router.push(`/email/${emailEntry.emailId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-patr-orange" />
        <p className="text-sm text-muted-foreground font-semibold">Sare accounts se patra load kiye ja rahe hain...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-background/50 backdrop-blur sticky top-16 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-patr-orange/10 flex items-center justify-center text-patr-orange shadow-sm border border-patr-orange/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">Primary Inbox</h1>
            <p className="text-xs text-muted-foreground mt-1">Sare logged in accounts ke patra yahan ek sath dikhte hain.</p>
          </div>
        </div>
        
        <button
          onClick={() => fetchUnifiedMailbox(true)}
          disabled={refreshing}
          className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all duration-200 active:scale-95 border border-border/30 flex items-center gap-1.5 text-xs font-bold bg-background/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Logged in accounts badge panel */}
      {accounts.length > 0 && (
        <div className="px-6 py-2.5 bg-muted/20 border-b border-border/20 flex flex-wrap gap-2 items-center select-none text-[10px] font-bold text-muted-foreground/80">
          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Connected Accounts:</span>
          {accounts.map((account) => {
            const isActive = account.email.toLowerCase() === currentUser?.email?.toLowerCase();
            return (
              <span
                key={account.email}
                className={`px-2 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? 'bg-patr-orange/10 text-patr-orange border-patr-orange/20 shadow-sm'
                    : 'bg-background text-foreground/75 border-border'
                }`}
              >
                {account.email} {isActive && '(active)'}
              </span>
            );
          })}
        </div>
      )}

      {/* Combined Emails List */}
      <div className="flex-1">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">Koi Patra Nahi Hai</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Logged in accounts ke mailbox folder me koi patra nahi mila.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {emails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                selected={false}
                onToggleSelect={() => {}}
                onToggleStar={() => {}}
                accountEmail={email.accountEmail}
                onRowClick={() => handleEmailClick(email)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Switching Loader */}
      {isSwitching && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-fade-in select-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-2xl max-w-xs text-center">
            <Loader2 className="w-10 h-10 animate-spin text-patr-orange" />
            <div>
              <p className="text-sm font-bold text-foreground">Account Badla Ja Raha Hai</p>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{switchingEmail}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
