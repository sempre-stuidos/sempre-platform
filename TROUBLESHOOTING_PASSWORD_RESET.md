# Troubleshooting Password Reset 500 Error

## Current Error
```
Error sending reset email: AuthApiError: Error sending recovery email
Failed to load resource: the server responded with a status of 500
```

## Root Causes

The 500 error can be caused by several issues:

### 1. Redirect URL Not Whitelisted (Most Common)

**Symptom**: 500 error when calling `resetPasswordForEmail()`

**Solution**: Add redirect URLs to Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `kvirwlcodrpwnwzvfcqr`
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add these **exact** URLs (one per line):
   ```
   https://se-hub.vercel.app/auth/reset-password
   https://se-hub.vercel.app/client/auth/reset-password
   ```
5. Click **Save**

**Important**: 
- URLs must match **exactly** (including https, no trailing slash)
- Changes take effect immediately (no restart needed)
- You may need to request a NEW password reset email after adding URLs

### 2. Site URL Not Configured

**Symptom**: Same 500 error

**Solution**: Set the Site URL in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://se-hub.vercel.app`
3. Click **Save**

### 3. Email Provider Not Configured

**Symptom**: 500 error, emails not sending

**Solution**: Configure SMTP in Supabase

1. In Supabase Dashboard, go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your email provider (SendGrid, AWS SES, etc.)
4. Or use Supabase's default email service (may have limits)

**Note**: Free tier Supabase projects have email sending limits. For production, configure a custom SMTP provider.

### 4. Email Confirmation Required

**Symptom**: Emails not sending for unconfirmed users

**Solution**: Check email confirmation settings

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**
2. Check if **Confirm email** is enabled
3. If enabled, users must confirm their email before password reset works

## Step-by-Step Fix

### Step 1: Check Console Logs

Open browser console (F12) and look for:
```
Attempting password reset with redirect URL: https://se-hub.vercel.app/auth/reset-password
Base URL: https://se-hub.vercel.app
```

This confirms the URL being sent to Supabase.

### Step 2: Verify Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `kvirwlcodrpwnwzvfcqr`
3. Go to **Authentication** → **URL Configuration**
4. Verify these settings:

   **Site URL**: `https://se-hub.vercel.app`
   
   **Redirect URLs** (should include):
   - `https://se-hub.vercel.app/auth/reset-password`
   - `https://se-hub.vercel.app/client/auth/reset-password`
   - `https://se-hub.vercel.app/auth/callback` (if using OAuth)

### Step 3: Check Email Settings

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Verify email provider is configured
3. Test email sending if possible

### Step 4: Test Again

1. Go to https://se-hub.vercel.app/login
2. Enter your email
3. Click "Forgot Password?"
4. Check console for the redirect URL being used
5. If error persists, check Supabase logs:
   - Go to **Logs** → **Auth Logs**
   - Look for errors related to password reset

## Quick Checklist

- [ ] Redirect URLs added to Supabase Dashboard
- [ ] Site URL set to `https://se-hub.vercel.app`
- [ ] SMTP/Email provider configured
- [ ] Email confirmation settings checked
- [ ] New password reset email requested (old emails won't work)
- [ ] Browser console checked for redirect URL logs

## Still Not Working?

1. **Check Supabase Logs**:
   - Dashboard → **Logs** → **Auth Logs**
   - Look for detailed error messages

2. **Verify Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` should be your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be your production anon key

3. **Test with Different Email**:
   - Try with a different email address
   - Some emails may be blocked or have issues

4. **Contact Supabase Support**:
   - If all else fails, check Supabase status page
   - Or contact support with your project ID: `kvirwlcodrpwnwzvfcqr`

## Expected Behavior After Fix

1. User clicks "Forgot Password?"
2. Success message: "Password reset email sent! Check your inbox."
3. Email arrives with reset link
4. Clicking link redirects to: `https://se-hub.vercel.app/auth/reset-password?code=...`
5. User can set new password

