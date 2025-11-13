# Fix "Error 401: invalid_client" - OAuth Client Not Found

## Problem

Getting "Error 401: invalid_client - The OAuth client was not found" on production.

## Root Cause

The `GOOGLE_CLIENT_ID` in Vercel doesn't match any OAuth client in your Google Cloud Console project, OR the environment variable is not set correctly.

## Solution: Verify and Fix Client ID

### Step 1: Get Your Correct Client ID from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one you want to use for Google Drive)
5. Click on it to view details
6. **Copy the Client ID** (it should look like: `478895160451-0hkscasndtpf7af60777v1mucnjs87vj.apps.googleusercontent.com`)

### Step 2: Verify Client ID in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `GOOGLE_CLIENT_ID`
3. **Compare it character-by-character** with the Client ID from Google Cloud Console
4. They must match EXACTLY

### Step 3: Update Vercel Environment Variables

If they don't match, or if the variable is missing:

1. In Vercel, click **Edit** on `GOOGLE_CLIENT_ID`
2. **Delete the entire value**
3. **Paste the Client ID** directly from Google Cloud Console (copy-paste, don't type)
4. Make sure there are:
   - ✅ No spaces before or after
   - ✅ No newlines
   - ✅ No quotes around it
5. Click **Save**
6. Do the same for `GOOGLE_CLIENT_SECRET`
7. **Redeploy** your application

### Step 4: Check Vercel Logs

After redeploying, check the logs to verify the Client ID:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **Logs**
4. Look for: `Client ID (first 30 chars): 478895160451-0hkscasndtpf7...`
5. Verify this matches your Google Cloud Console Client ID

### Step 5: Verify Redirect URI

Also make sure the redirect URI is correct in Google Cloud Console:

1. In Google Cloud Console → **Credentials** → Your OAuth Client
2. Under **Authorized redirect URIs**, you should have:
   - ✅ `https://sempre-studios.vercel.app/api/google-drive/callback`
   - ✅ `http://localhost:3000/api/google-drive/callback`
3. Make sure `https://sempre-studios.vercel.app/api/google-drive/callback` is there (with the full path)

## Common Issues

### Issue 1: Wrong Project Selected
- Make sure you're looking at the **correct Google Cloud project**
- The Client ID must be from the same project

### Issue 2: Multiple OAuth Clients
- You might have multiple OAuth clients
- Make sure you're using the **same Client ID** in both:
  - Google Cloud Console (for redirect URIs)
  - Vercel environment variables

### Issue 3: Client ID Format
- Should be: `numbers-lettersandnumbers.apps.googleusercontent.com`
- Should NOT have:
  - Spaces
  - Newlines
  - Quotes
  - Extra characters

### Issue 4: Environment Variable Not Set for Production
- In Vercel, make sure `GOOGLE_CLIENT_ID` is set for **Production** environment
- Not just Preview or Development

## Quick Checklist

- [ ] Copied Client ID directly from Google Cloud Console
- [ ] Pasted into Vercel `GOOGLE_CLIENT_ID` (no spaces, no newlines)
- [ ] Verified `GOOGLE_CLIENT_SECRET` is also set correctly
- [ ] Both variables set for **Production** environment in Vercel
- [ ] Redeployed application after updating variables
- [ ] Verified redirect URI `https://sempre-studios.vercel.app/api/google-drive/callback` is in Google Cloud Console
- [ ] Checked Vercel logs to confirm Client ID matches

## Still Not Working?

1. **Double-check the Client ID**:
   - Copy from Google Cloud Console
   - Paste into a text editor
   - Check for any hidden characters
   - Copy again and paste into Vercel

2. **Verify the OAuth Client is Active**:
   - In Google Cloud Console, make sure the OAuth client shows as "Active"
   - Not deleted or disabled

3. **Check Project Selection**:
   - Make sure you're using the Client ID from the correct Google Cloud project
   - The project where Google Drive API is enabled

4. **Try Creating a New OAuth Client** (if nothing else works):
   - Create a new OAuth 2.0 Client ID in Google Cloud Console
   - Add the redirect URIs
   - Use the new Client ID in Vercel

