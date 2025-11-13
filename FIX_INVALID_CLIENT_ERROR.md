# Fix "Error 401: invalid_client" - OAuth Client Not Found

## Problem

Getting "Error 401: invalid_client - The OAuth client was not found" when trying to connect Google Drive.

## Root Causes

1. **Missing full redirect URI path** - You have `https://sempre-studios.vercel.app` but need the full path
2. **Newline character in environment variable** - The `client_id` has a newline (`%0A` in URL)
3. **Wrong OAuth Client ID** - Using a different client ID than configured

## Solution

### Step 1: Fix Redirect URI in Google Cloud Console

Your current redirect URIs show:
- ❌ `https://sempre-studios.vercel.app` (missing the `/api/google-drive/callback` path)
- ✅ `http://localhost:3000/api/google-drive/callback` (correct)

**Action Required:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Edit** on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, find:
   - `https://sempre-studios.vercel.app` (this is wrong)
5. **Remove** `https://sempre-studios.vercel.app`
6. **Add** `https://sempre-studios.vercel.app/api/google-drive/callback` (with full path)
7. Click **Save**

### Step 2: Fix Environment Variables in Vercel

The error shows `client_id=478895160451-0hkscasndtpf7af60777v1mucnjs87vj.apps.googleusercontent.com%0A` - the `%0A` is a newline character!

**Action Required:**

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `GOOGLE_CLIENT_ID`
3. Click **Edit**
4. **Remove any trailing spaces or newlines** from the value
5. The value should be EXACTLY: `478895160451-0hkscasndtpf7af60777v1mucnjs87vj.apps.googleusercontent.com`
6. Do the same for `GOOGLE_CLIENT_SECRET` (remove any trailing spaces/newlines)
7. **Redeploy** your application

### Step 3: Verify Your Setup

After making changes, verify:

**Google Cloud Console:**
- ✅ `http://localhost:3000/api/google-drive/callback`
- ✅ `https://sempre-studios.vercel.app/api/google-drive/callback` (with full path)
- ❌ Remove: `https://sempre-studios.vercel.app` (without path)
- ❌ Remove: `https://vjofgteuljixzsioqqer.supabase.co/api/google-drive/callback` (this is Supabase, not needed)

**Vercel Environment Variables:**
- `GOOGLE_CLIENT_ID` = `478895160451-0hkscasndtpf7af60777v1mucnjs87vj.apps.googleusercontent.com` (no newlines, no spaces)
- `GOOGLE_CLIENT_SECRET` = Your secret (no newlines, no spaces)

### Step 4: Wait and Test

1. Wait 2-3 minutes after updating Google Cloud Console
2. Wait for Vercel redeployment to complete
3. Go to: https://sempre-studios.vercel.app/files-assets
4. Try connecting Google Drive again

## How to Check for Newlines in Vercel

When editing environment variables in Vercel:
1. Copy the entire value
2. Paste it into a text editor
3. Look for any invisible characters at the end
4. Remove them
5. Copy the clean value back

## Quick Checklist

- [ ] Removed `https://sempre-studios.vercel.app` from Google Cloud Console
- [ ] Added `https://sempre-studios.vercel.app/api/google-drive/callback` (with full path)
- [ ] Removed trailing newlines/spaces from `GOOGLE_CLIENT_ID` in Vercel
- [ ] Removed trailing newlines/spaces from `GOOGLE_CLIENT_SECRET` in Vercel
- [ ] Redeployed application in Vercel
- [ ] Waited 2-3 minutes after changes
- [ ] Tested the connection

## Code Fix Applied

I've updated the code to automatically trim whitespace from environment variables, but you still need to:
1. Fix the redirect URI in Google Cloud Console
2. Clean up the environment variables in Vercel

