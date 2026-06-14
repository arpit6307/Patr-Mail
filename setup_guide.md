# Patr (पत्र) — Environment Setup Guide (.env)

Aapko project run aur deploy karne ke liye ek `.env.local` file banani hogi project root directory mein (aap `.env.local.example` ko copy karke `.env.local` rename kar sakte hain).

Aapko niche bataye gaye har ek key ko setup karna hoga. Yahaan unhe paane aur configure karne ka **step-by-step process** hai:

---

## 1. Firebase Setup (Sabse Pehle)

Firebase aapki Application Authentication aur Databases (Firestore aur Realtime DB) ko handle karta hai.

### Step 1: Firebase Project Banayein
1. [Firebase Console](https://console.firebase.google.com/) par jaayein.
2. **Add Project** button par click karein.
3. Apne project ka naam rakhein: `Patr-Mail` (ya jo aap chahein).
4. Google Analytics ko **disable** kar sakte hain (fast setup ke liye) aur **Create Project** par click karein.

### Step 2: Firebase Web App Register Karein
1. Project dashboard khulne ke baad, center mein **Web icon ( `</>` )** par click karein.
2. Apne app ka Nickname rakhein (e.g. `Patr Web`) aur **Register App** par click karein.
3. Register hote hi aapko ek `firebaseConfig` code snippet dikhega. Usme se niche likhe values ko copy karke apne `.env.local` mein daalein:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDhWfgNsJNKWtnAFRLBBAoW19AoBHiRpmU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=patr-mail.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=patr-mail
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=900351791817
NEXT_PUBLIC_FIREBASE_APP_ID=1:900351791817:web:f46f4d0ec104312e247318
```

---

## 2. Firebase Services Enable & Rules Setup (Zaroori Steps)

Firebase Console ke left sidebar se niche di gayi har service ko active karein aur security rules configure karein:

### A. Authentication (Users Signup/Login ke liye)
1. Sidebar mein **Build > Authentication** par click karein.
2. **Get Started** button dabaayein.
3. **Sign-in method** tab mein **Email/Password** select karein.
4. **Email/Password** ko enable karein aur Save karein.

### B. Cloud Firestore (User Profiles aur Emails Store karne ke liye)
1. Sidebar mein **Build > Firestore Database** par click karein.
2. **Create database** par click karein.
3. Location select karein (e.g. `asia-south1` for Mumbai, or default).
4. Database create hone ke baad, top menu tab mein **Rules** select karein.
5. Wahaan default code ko delete karke, project directory mein rakhe `firestore.rules` file ke code ko paste karein:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAuthenticated() {
         return request.auth != null;
       }
       function isOwner(userId) {
         return isAuthenticated() && request.auth.uid == userId;
       }
       match /users/{userId} {
         allow read: if true;
         allow write: if isOwner(userId);
         match /mailbox/{mailboxId} {
           allow read, write: if isOwner(userId);
         }
       }
       match /emails/{emailId} {
         allow create: if isAuthenticated();
         allow read, update, delete: if isAuthenticated();
       }
     }
   }
   ```
6. **Publish** button par click karein.

### C. Realtime Database (Live unread notifications aur counts ke liye)
1. Sidebar mein **Build > Realtime Database** par click karein.
2. **Create Database** par click karein.
3. Location select karein aur Next karein.
4. Database active hone ke baad, top par ek URL dikhega (e.g., `https://patr-mail-default-rtdb.firebaseio.com`). Is URL ko copy karke `.env.local` mein daalein:
   ```env
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://patr-mail-default-rtdb.firebaseio.com
   ```
5. Top menu tab mein **Rules** select karein.
6. Wahaan default code ko replace karke, project directory mein rakhe `database.rules.json` file ke code ko paste karein:
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           "unreadCount": {
             ".read": "auth != null && auth.uid == $uid",
             ".write": "true"
           }
         }
       }
     }
   }
   ```
7. **Publish** button par click karein.

---

## 3. Supabase Storage Setup (Attachments ke liye - 100% Free, No Card Required)

Firebase Storage ke credit card/billing subscription maangne ke karan hum **Supabase Storage** ka use karenge jo ki 1GB bilkul free general file storage bina card link kiye pradan karta hai.

### Step 1: Supabase Project Banayein
1. [Supabase Website](https://supabase.com/) par jaayein aur **Start your project** select karke signup/login karein.
2. **New Project** button par click karein.
3. Apna Organization select karein, project Name rakhein (e.g., `Patr-Storage`), aur database password set karein.
4. Location select karein (e.g., Mumbai `ap-south-1` for fast connection) aur **Create new project** dabaayein.

### Step 2: Storage Bucket Banayein
1. Project dashboard khulne ke baad, left menu bar se **Storage** (bucket icon) select karein.
2. **New Bucket** button par click karein.
3. Bucket ka naam **exact** rakhein: `attachments`
4. **Public bucket** option ko **Enable (checked)** karein (isase attachments ko access karne ke liye link access free aur public ho jayega).
5. **Save** par click karein.

### Step 3: API Credentials Copy Karein
1. Left sidebar ke sabse niche **Project Settings** (gear icon) par click karein.
2. Sub-menu mein **API** select karein.
3. Wahaan se credentials copy karke `.env.local` mein daalein:
   - **Project URL**: copy karke `NEXT_PUBLIC_SUPABASE_URL` mein daalein.
   - **API Keys (anon public)**: copy karke `NEXT_PUBLIC_SUPABASE_ANON_KEY` mein daalein.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Resend API Setup (Transactional OTP ke liye)

Resend ke zariye hum users ko OTP aur verification emails bhejte hain.

1. [Resend Dashboard](https://resend.com/) par jaakar register ya login karein.
2. Left menu mein **API Keys** par click karein.
3. **Create API Key** button dabaayein.
4. Name rakhein (e.g. `Patr Local`) aur permissions **Full Access** rakhein.
5. Create hone par jo key dikhegi, copy karke `.env.local` mein daalein:

```env
RESEND_API_KEY=re_Zdo5Jvdt_BY75LXwEp6wrWG624q7bGHPj
```

---

## 5. App Configuration

Apne local server aur vercel settings ke liye configurations:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Patr
NEXT_PUBLIC_APP_DOMAIN=patr.in
```

---

## 6. Vercel Par Deploy Karte Time Environment Variables Checklist

Vercel par project deploy karte samay, environment variables section mein niche diye gaye list ko add karna na bhulein:

1. `NEXT_PUBLIC_FIREBASE_API_KEY`
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
4. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
5. `NEXT_PUBLIC_FIREBASE_APP_ID`
6. `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
7. `NEXT_PUBLIC_SUPABASE_URL`
8. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
9. `RESEND_API_KEY`
10. `NEXT_PUBLIC_APP_URL`
11. `NEXT_PUBLIC_APP_NAME`
12. `NEXT_PUBLIC_APP_DOMAIN`

Aapka deployment successfully build aur run ho jayega!
