# Fix Google Drive 400 Error on Vercel Production

## The Problem

You're getting a 400 error when trying to connect Google Drive on `https://sempre-studios.vercel.app/files-assets`.

## Important: Two Different OAuth Configurations

⚠️ **There are TWO separate OAuth configurations:**

1. **Supabase Auth Redirect URLs** (for user authentication)
   - Configured in Supabase Dashboard → Authentication → URL Configuration
   - Used when users sign in with Google through Supabase
   - ✅ You already have these configured

2. **Google Cloud Console Redirect URIs** (for Google Drive API)
   - Configured in **Google Cloud Console** → APIs & Services → Credentials
   - Used for the Google Drive file import feature
   - ❌ **This is what needs to be fixed**

The Google Drive integration uses a **direct Google OAuth flow** (not through Supabase), so you need to add the callback URL to **Google Cloud Console**, not Supabase.

## Solution: Add Production URL to Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client

1. Find your OAuth 2.0 Client ID (the one you're using for Google Drive)
2. Click **Edit** (pencil icon)

### Step 3: Add Production Redirect URI

1. Scroll to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Add this EXACT URL:
   ```
   https://sempre-studios.vercel.app/api/google-drive/callback
   ```
4. **CRITICAL**: Make sure it's EXACTLY:
   - ✅ `https://sempre-studios.vercel.app/api/google-drive/callback`
   - ❌ NOT `https://sempre-studios.vercel.app/api/google-drive/callback/` (no trailing slash)
   - ❌ NOT `http://sempre-studios.vercel.app/api/google-drive/callback` (must be https)
   - ❌ NOT `https://sempre-studios.vercel.app/**` (must be exact path)

5. Click **Save**

### Step 4: Verify Your Redirect URIs

You should have BOTH of these in your Authorized redirect URIs:
- `http://localhost:3000/api/google-drive/callback` (for local development)
- `https://sempre-studios.vercel.app/api/google-drive/callback` (for production)

### Step 5: Set Environment Variables in Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Make sure these are set for **Production**:
   - `GOOGLE_CLIENT_ID` = Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` = Your Google OAuth Client Secret
5. If you just added them, **redeploy** your application

### Step 6: Wait and Test

1. Wait 2-3 minutes after saving in Google Cloud Console (changes need to propagate)
2. Go to: https://sempre-studios.vercel.app/files-assets
3. Click "Import from Drive"
4. Click "Connect Google Drive"
5. It should now work! ✅

## Why This Happens

- **Supabase redirect URLs** are for Supabase Auth (user login)
- **Google Cloud Console redirect URIs** are for direct Google API access (Google Drive)
- The Google Drive integration bypasses Supabase and talks directly to Google
- That's why you need the URL in **both places** but for **different purposes**

## Quick Checklist

- [ ] Added `https://sempre-studios.vercel.app/api/google-drive/callback` to Google Cloud Console
- [ ] Verified no trailing slash
- [ ] Verified it's `https://` not `http://`
- [ ] `GOOGLE_CLIENT_ID` set in Vercel (Production)
- [ ] `GOOGLE_CLIENT_SECRET` set in Vercel (Production)
- [ ] Redeployed after adding environment variables
- [ ] Waited 2-3 minutes after updating Google Cloud Console

## Still Not Working?

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Logs
   - Look for: `Google OAuth redirect_uri: https://sempre-studios.vercel.app/api/google-drive/callback`
   - Verify this EXACT URL is in Google Cloud Console

2. **Double-check Google Cloud Console**:
   - Make sure you're editing the **correct** OAuth Client ID
   - The one that matches your `GOOGLE_CLIENT_ID` environment variable
   - Copy-paste the redirect URI to avoid typos

3. **Clear Browser Cache**:
   - Sometimes browsers cache OAuth errors
   - Try incognito/private mode

4. **Check OAuth Consent Screen**:
   - Make sure your email is added as a test user (if in Testing mode)
   - See `QUICK_FIX_GOOGLE_OAUTH.md` for details

