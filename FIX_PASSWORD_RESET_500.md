# Fix Password Reset 500 Error (URL Already Whitelisted)

## Problem
Getting 500 error even though the redirect URL is already in the Supabase allow list:
```
Error sending reset email: AuthApiError: Error sending recovery email
```

## Root Causes (When URL is Already Whitelisted)

Since the redirect URL is already configured, the issue is likely one of these:

### 1. Site URL Not Set ✅ **MOST LIKELY ISSUE**

**Check**: In Supabase Dashboard → Authentication → URL Configuration

**Fix**: 
1. Set **Site URL** to: `https://se-hub.vercel.app`
2. This must match your production domain exactly
3. Click **Save**

**Why**: Supabase uses the Site URL as the base for email links. If it's not set or incorrect, password reset emails will fail.

### 2. Email/SMTP Not Configured ✅ **SECOND MOST LIKELY**

**Check**: In Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Fix**:
1. Configure a custom SMTP provider (SendGrid, AWS SES, Mailgun, etc.)
2. OR ensure Supabase's default email service is working
3. Free tier projects may have email sending limits

**Why**: Without proper email configuration, Supabase cannot send password reset emails.

### 3. Email Confirmation Required

**Check**: In Supabase Dashboard → Authentication → Providers → Email

**Fix**:
1. Check if **"Confirm email"** is enabled
2. If enabled, users must confirm their email before password reset works
3. Consider disabling for password reset flows, or ensure users have confirmed emails

### 4. Email Rate Limiting

**Check**: Supabase may be rate limiting email sends

**Fix**:
1. Wait a few minutes before trying again
2. Check Supabase logs for rate limit errors
3. Consider upgrading your Supabase plan if you hit limits frequently

## Step-by-Step Fix

### Step 1: Verify Site URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. **Site URL** should be: `https://se-hub.vercel.app`
5. If it's different or empty, set it and click **Save**

### Step 2: Check Email Configuration

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Check if SMTP is configured:
   - If "Use custom SMTP" is enabled, verify credentials are correct
   - If using default Supabase email, check if you've hit sending limits
3. For production, **strongly recommend** configuring a custom SMTP provider

### Step 3: Check Email Confirmation Settings

1. Go to **Authentication** → **Providers** → **Email**
2. Check **"Confirm email"** setting
3. If enabled, users must confirm email before password reset
4. Consider your use case - you may want to disable this for password reset flows

### Step 4: Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase Dashboard
2. Look for errors around the time you tried to send the reset email
3. The logs will show the exact error from Supabase's side

### Step 5: Test with Console Logs

1. Open browser console (F12)
2. Try to send password reset email
3. Check console for:
   ```
   Attempting password reset with redirect URL: https://se-hub.vercel.app/auth/reset-password
   Base URL: https://se-hub.vercel.app
   Full error object: {...}
   Error status: 500
   ```
4. The full error object will have more details

## Quick Checklist

- [ ] **Site URL** set to `https://se-hub.vercel.app` in Supabase
- [ ] **Redirect URLs** include `https://se-hub.vercel.app/auth/reset-password`
- [ ] **SMTP/Email** provider configured in Supabase
- [ ] **Email confirmation** settings checked
- [ ] **Supabase logs** checked for detailed errors
- [ ] **Browser console** checked for full error details

## Most Common Fix

**90% of the time**, when the redirect URL is already whitelisted but you still get a 500 error, it's because:

1. **Site URL is not set** - Set it to `https://se-hub.vercel.app`
2. **Email/SMTP is not configured** - Configure a custom SMTP provider

## Still Not Working?

1. **Check Supabase Status**: https://status.supabase.com
2. **Review Auth Logs**: Dashboard → Logs → Auth Logs
3. **Contact Supabase Support**: Include your project ID and the exact error from console logs
4. **Try Different Email**: Test with a different email address to rule out user-specific issues

## Expected Console Output (After Fix)

When working correctly, you should see:
```
Attempting password reset with redirect URL: https://se-hub.vercel.app/auth/reset-password
Base URL: https://se-hub.vercel.app
```

And then a success toast: "Password reset email sent! Check your inbox."
