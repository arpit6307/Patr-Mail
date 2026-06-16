# Vercel Deployment & Configuration Guide — Patr (पत्र)

This guide documents the setup instructions, environment variables, and configurations required to deploy the Patr Workspace web application on Vercel with zero issues.

---

## 1. Required Environment Variables

When importing the project to Vercel, you **must** add the following environment variables in the Vercel Dashboard under **Settings > Environment Variables**.

Copy and paste these keys and their corresponding values from your local `.env.local` file:

| Environment Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `patr-mail.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `patr-mail` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App App ID | `1:900351791817:web:...` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL | `https://patr-mail-default-rtdb.firebaseio.com` |
| `RESEND_API_KEY` | Resend API Key for Email OTP & Sending | `re_aamQTvMZ...` |

> [!NOTE]
> All variables prefixed with `NEXT_PUBLIC_` are automatically packaged into the client-side JavaScript bundles by Next.js during Vercel's build process. Make sure to double-check their values.

---

## 2. Step-by-Step Vercel Deployment

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in using your GitHub account.
2. **Add New Project**: Click on **Add New > Project**.
3. **Import Repository**: Select the **`Patr-Mail`** repository from your list.
4. **Configure Project Settings**:
   - **Framework Preset**: Next.js (detected automatically).
   - **Root Directory**: `./` (detected automatically).
   - **Build Command**: `npm run build` (detected automatically).
   - **Output Directory**: `.next` (detected automatically).
5. **Add Environment Variables**: Under the "Environment Variables" section, add all 6 key-value pairs listed in the table above.
6. **Deploy**: Click the **Deploy** button.

---

## 3. Post-Deployment Verification

Once deployed, Vercel will provide you with a production URL (e.g., `https://patr-mail.vercel.app`).

### Checklist:
* **Firebase Authorized Domains**: 
  1. Go to your **Firebase Console > Authentication > Settings > Authorized Domains**.
  2. Click **Add Domain** and add your Vercel deployment URL (e.g., `patr-mail.vercel.app` and `patr-mail-git-main-yourusername.vercel.app`).
  3. This is **required** to ensure that Firebase Authentication and OTP registration flows function on the live Vercel domain.
* **Resend API Integration**:
  Ensure your Resend API domain settings allow sending transactional emails, or use the dev fallback/sandbox modes configured in the application.

---

## 4. Continuous Deployment (CI/CD)

Any commit pushed to the `main` branch of your GitHub repository `https://github.com/arpit6307/Patr-Mail.git` will **automatically trigger a new Vercel deployment** and update your live site.
