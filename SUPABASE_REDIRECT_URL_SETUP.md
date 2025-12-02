# Supabase Redirect URL Configuration

## Problem
Getting 500 errors when sending password reset emails in production:
```
Error sending reset email: AuthApiError: Error sending recovery email
```

This happens when the redirect URL used in `resetPasswordForEmail()` is not whitelisted in your Supabase project.

## Solution

### For Production Supabase (Cloud)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add these URLs:
   - `https://se-hub.vercel.app/auth/reset-password`
   - `https://se-hub.vercel.app/client/auth/reset-password`
   - `https://se-hub.vercel.app/auth/callback` (if using OAuth)
5. Click **Save**

### For Local Development

The local Supabase config is in `supabase/config.toml`:

```toml
[auth]
additional_redirect_urls = [
  "http://localhost:3000/auth/reset-password",
  "http://127.0.0.1:3000/auth/reset-password",
  "http://localhost:3000/client/auth/reset-password",
  "http://127.0.0.1:3000/client/auth/reset-password",
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
]
```

After updating, restart Supabase:
```bash
npx supabase stop
npx supabase start
```

## Important Notes

1. **URLs must match exactly** - including protocol (http/https), domain, and path
2. **No trailing slashes** - `https://example.com/auth/reset-password` ✅ not `https://example.com/auth/reset-password/` ❌
3. **Wildcards are not supported** - You must add each URL explicitly
4. **Changes take effect immediately** - No restart needed for cloud Supabase

## Testing

After adding the URLs:
1. Request a new password reset email (old emails won't work)
2. The email should send successfully
3. Click the link in the email
4. You should be redirected to the reset password page

## Current Redirect URLs Used

The code automatically uses `window.location.origin` to determine the base URL:

- **Local**: `http://localhost:3000` or `http://127.0.0.1:3000`
- **Production**: `https://se-hub.vercel.app`

Make sure both of these domains have their reset password URLs whitelisted in Supabase.
