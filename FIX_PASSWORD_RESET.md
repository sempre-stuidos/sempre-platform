# Fix Password Reset "access_denied" Error

## The Problem
Getting "access_denied" (403) error when clicking password reset links in emails.

## Root Cause
Supabase validates the redirect URL when generating the reset email. If the URL isn't in the allowed list at that time, the email link will always fail, even if you add it to the config later.

## Solution

### Step 1: Restart Supabase (REQUIRED)
The config changes won't take effect until Supabase is restarted:

```bash
cd agency-light
npx supabase stop
npx supabase start
```

### Step 2: Verify Config
Check that `supabase/config.toml` has these redirect URLs:

```toml
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
  "https://127.0.0.1:3000/auth/callback",
  "http://localhost:3000/auth/reset-password",
  "http://127.0.0.1:3000/auth/reset-password",
  "http://localhost:3000/client/auth/reset-password",
  "http://127.0.0.1:3000/client/auth/reset-password"
]
```

### Step 3: Request a NEW Password Reset Email
**IMPORTANT**: The old reset email won't work because it was generated with the old (invalid) redirect URL. You must:

1. Go to the login page
2. Enter your email
3. Click "Forgot Password?" again
4. This will generate a NEW email with the correct redirect URL

### Step 4: Check Supabase Studio (Alternative)
If restarting doesn't work, you can also add redirect URLs via Supabase Studio:

1. Open http://127.0.0.1:54323
2. Go to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs**:
   - `http://127.0.0.1:3000/auth/reset-password`
   - `http://localhost:3000/auth/reset-password`
   - `http://127.0.0.1:3000/client/auth/reset-password`
   - `http://localhost:3000/client/auth/reset-password`
4. Click **Save**

## For Production/Cloud Supabase

If you're using cloud Supabase (not local):

1. Go to your Supabase Dashboard (supabase.com)
2. Navigate to **Authentication** → **URL Configuration**
3. Add the production redirect URLs:
   - `https://yourdomain.com/auth/reset-password`
   - `https://yourdomain.com/client/auth/reset-password`
4. Click **Save**

## Testing

After restarting Supabase and requesting a new reset email:

1. Click "Forgot Password?" on login page
2. Check your email (or Inbucket at http://127.0.0.1:54324 for local)
3. Click the reset link in the email
4. You should be redirected to `/auth/reset-password` (or `/client/auth/reset-password`)
5. The page processes the token and redirects to login with `?reset=true`
6. Login form shows password setup form
7. Set new password and sign in

## Troubleshooting

- **Still getting access_denied**: Make sure you requested a NEW reset email AFTER restarting Supabase
- **Link expires immediately**: Check `jwt_expiry` in config.toml (default is 3600 seconds = 1 hour)
- **Redirect URL not working**: Verify the exact URL matches what's in the config (including http/https, port, and path)
