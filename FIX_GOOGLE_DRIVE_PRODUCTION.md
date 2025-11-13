# Fix Google Drive Connection on Production

## The Issue

✅ **Google Login works** (uses Supabase Auth)  
❌ **Google Drive connection fails** (uses direct Google OAuth)

These use **TWO DIFFERENT OAuth flows**:

1. **Google Login** → Supabase handles OAuth → Redirects to `/auth/callback` → Configured in Supabase Dashboard ✅
2. **Google Drive** → Direct Google OAuth → Redirects to `/api/google-drive/callback` → Must be in **Google Cloud Console** ❌

## The Problem

Your Google Cloud Console redirect URIs show you have:
- ✅ `http://localhost:3000/api/google-drive/callback` (works locally)
- ❌ `https://sempre-studios.vercel.app` (missing the `/api/google-drive/callback` path!)

You need to **replace** `https://sempre-studios.vercel.app` with `https://sempre-studios.vercel.app/api/google-drive/callback`

## Solution: Fix Redirect URI in Google Cloud Console

### Step 1: Identify the Correct OAuth Client

You might have **TWO different OAuth clients**:

1. **OAuth Client for Supabase Auth** (used for login)
   - This one works ✅
   - Has redirect URIs like: `https://vjofgteuljixzsioqqer.supabase.co/auth/v1/callback`

2. **OAuth Client for Google Drive** (used for file import)
   - This one needs fixing ❌
   - Should have: `https://sempre-studios.vercel.app/api/google-drive/callback`

**OR** you might be using the **same OAuth client** for both, in which case you just need to add the missing redirect URI.

### Step 2: Find the OAuth Client Used for Google Drive

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Look at your OAuth 2.0 Client IDs
5. Check which one has `http://localhost:3000/api/google-drive/callback` in its redirect URIs
6. **This is the one you need to edit**

### Step 3: Fix the Redirect URI

1. Click **Edit** on the OAuth client that has the localhost Google Drive callback
2. Under **Authorized redirect URIs**, find:
   - `https://sempre-studios.vercel.app` (this is wrong - missing path)
3. **Remove** `https://sempre-studios.vercel.app`
4. **Add** `https://sempre-studios.vercel.app/api/google-drive/callback` (with full path)
5. Make sure you have BOTH:
   - ✅ `http://localhost:3000/api/google-drive/callback` (for local)
   - ✅ `https://sempre-studios.vercel.app/api/google-drive/callback` (for production)
6. Click **Save**
7. Wait 2-3 minutes for changes to propagate

### Step 4: Verify Environment Variables in Vercel

Make sure the `GOOGLE_CLIENT_ID` in Vercel matches the OAuth client you just edited:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Check `GOOGLE_CLIENT_ID`
3. It should match the Client ID of the OAuth client you just edited
4. If it doesn't match, update it to the correct one
5. **Redeploy** after any changes

### Step 5: Clean Up Unnecessary Redirect URIs

You can remove these (they're for Supabase, not Google Drive):
- `https://vjofgteuljixzsioqqer.supabase.co/api/google-drive/callback` (not needed)
- `http://127.0.0.1:54321/auth/v1/callback` (Supabase local, not needed for Google Drive)

Keep only:
- `http://localhost:3000/api/google-drive/callback` (local Google Drive)
- `https://sempre-studios.vercel.app/api/google-drive/callback` (production Google Drive)

## Quick Checklist

- [ ] Found the OAuth client that has `http://localhost:3000/api/google-drive/callback`
- [ ] Removed `https://sempre-studios.vercel.app` (without path)
- [ ] Added `https://sempre-studios.vercel.app/api/google-drive/callback` (with full path)
- [ ] Verified `GOOGLE_CLIENT_ID` in Vercel matches this OAuth client
- [ ] Redeployed application in Vercel
- [ ] Waited 2-3 minutes after updating Google Cloud Console
- [ ] Tested the connection

## Why This Happens

- **Supabase Auth** uses its own callback: `/auth/callback` → Configured in Supabase ✅
- **Google Drive** uses direct OAuth: `/api/google-drive/callback` → Must be in Google Cloud Console ❌

They're completely separate flows, so they need separate redirect URI configurations!

## Still Not Working?

1. **Check Vercel Logs**:
   - Look for: `Google OAuth redirect_uri: https://sempre-studios.vercel.app/api/google-drive/callback`
   - Look for: `Client ID (first 30 chars): ...`
   - Verify the Client ID matches the one in Google Cloud Console

2. **Verify OAuth Client**:
   - Make sure the OAuth client you're editing is the one being used
   - The Client ID in Vercel must match the Client ID in Google Cloud Console

3. **Check OAuth Consent Screen**:
   - Make sure your email is added as a test user (if in Testing mode)

