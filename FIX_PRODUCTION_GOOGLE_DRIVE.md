# Fix Google Drive 400 Error on Production

## Problem
Getting "400. That's an error" when trying to connect Google Drive on production (Vercel) but it works locally.

## Root Causes

1. **Redirect URI not added to Google Cloud Console** (Most Common)
2. **Environment variables not set in Vercel**
3. **Redirect URI mismatch** (case-sensitive, trailing slashes, etc.)

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

## Solution Steps

### Step 1: Add Production Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Edit** on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://sempre-studios.vercel.app/api/google-drive/callback
   ```
6. **IMPORTANT**: Make sure it's EXACTLY this URL:
   - ✅ `https://sempre-studios.vercel.app/api/google-drive/callback`
   - ❌ `https://sempre-studios.vercel.app/api/google-drive/callback/` (no trailing slash)
   - ❌ `http://sempre-studios.vercel.app/api/google-drive/callback` (must be https)
7. Click **Save**
8. Wait 2-3 minutes for changes to propagate

### Step 2: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **Production** environment:
   - `GOOGLE_CLIENT_ID` = Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` = Your Google OAuth Client Secret
4. Make sure they're set for **Production** (not just Preview/Development)
5. **Redeploy** your application after adding variables

### Step 3: Verify Environment Variables

You can verify the variables are set by checking Vercel logs:
- Go to your Vercel project → **Deployments** → Click on latest deployment → **Logs**
- Look for any errors about missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`

### Step 4: Test the Connection

1. Go to `https://sempre-studios.vercel.app/files-assets`
2. Click "Import from Drive"
3. Click "Connect Google Drive"
4. You should be redirected to Google OAuth consent screen
5. After authorization, you should be redirected back

## Quick Checklist

- [ ] Production redirect URI added to Google Cloud Console: `https://sempre-studios.vercel.app/api/google-drive/callback`
- [ ] `GOOGLE_CLIENT_ID` set in Vercel environment variables (Production)
- [ ] `GOOGLE_CLIENT_SECRET` set in Vercel environment variables (Production)
- [ ] Application redeployed after adding environment variables
- [ ] Waited 2-3 minutes after updating Google Cloud Console
- [ ] Test user email added to OAuth consent screen (if in Testing mode)

## Debugging

### Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **Logs** tab
4. Look for:
   - `Google OAuth redirect_uri: https://sempre-studios.vercel.app/api/google-drive/callback`
   - Any errors about missing environment variables

### Check Google Cloud Console
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client
3. Verify the redirect URI is listed exactly as: `https://sempre-studios.vercel.app/api/google-drive/callback`

## Common Mistakes

1. **Forgetting to add production URL** - Only localhost was added
2. **Trailing slash** - Adding `/api/google-drive/callback/` instead of `/api/google-drive/callback`
3. **HTTP instead of HTTPS** - Using `http://` instead of `https://`
4. **Environment variables not set for Production** - Only set for Preview/Development
5. **Not redeploying** - Environment variables require a new deployment

## Still Not Working?

1. Check Vercel function logs for the exact redirect URI being used
2. Compare it character-by-character with what's in Google Cloud Console
3. Make sure there are no extra spaces or special characters
4. Try clearing browser cache and cookies
5. Check if the OAuth consent screen is in "Testing" mode and your email is added

