# Vercel Environment Variables Setup

## Problem: "Failed to fetch" on Login

The login fails because Supabase environment variables are **not set in Vercel**.

---

## Fix: Set these in Vercel Dashboard

Go to: https://vercel.com/dashboard → Your Project → **Settings** → **Environment Variables**

### Frontend Variables (required)
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_API_URL` | Leave **blank** or set to `/api` (Vercel rewrites handle it) |

### Backend Variables (required)
| Variable | Value |
|---|---|
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service role** key (NOT anon key) |
| `GOOGLE_DRIVE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_DRIVE_PRIVATE_KEY` | Service account private key |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID |
| `YOUTUBE_API_KEY` | YouTube Data API key |

---

## Where to find your Supabase keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## After setting variables
1. Click **Save** in Vercel
2. Go to **Deployments** → click **Redeploy** on the latest deployment
3. Wait for it to complete
4. Test login again ✅
