# OAuth Setup Guide - Fixing "No authorization code received"

## The Problem
If you're getting "No authorization code received", it's usually because the redirect URL doesn't match what's configured in Supabase.

## Solution for LOCAL Supabase

### 1. Access Local Supabase Studio

1. Make sure Supabase is running: `npx supabase start`
2. Open Supabase Studio in your browser: **http://127.0.0.1:54323**
3. You should see the Supabase Studio interface

### 2. Configure Redirect URL in Local Supabase Studio

1. In Supabase Studio (http://127.0.0.1:54323), go to **Authentication** → **URL Configuration**
2. In the **Redirect URLs** section, add:
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000/auth/callback` (if you're using 127.0.0.1)
3. Click **Save**

### 3. Alternative: Configure in config.toml

You can also add it directly to `supabase/config.toml`:

```toml
[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback"
]
```

Then restart Supabase: `npx supabase stop && npx supabase start`

## Solution for CLOUD Supabase

### 1. Configure Redirect URL in Supabase Dashboard

1. Go to your Supabase project dashboard (supabase.com)
2. Navigate to **Authentication** > **URL Configuration**
3. Add your redirect URLs to **Redirect URLs**:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

### 2. Configure Google OAuth in Supabase

1. Go to **Authentication** > **Providers** > **Google**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
4. **Important**: In Google Cloud Console, make sure your authorized redirect URIs include:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
   - This is Supabase's OAuth callback URL, not your app's callback

### 3. Verify Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 4. How It Works

1. User clicks "Sign in with Google"
2. User is redirected to Google OAuth
3. Google redirects to Supabase's callback: `https://[project].supabase.co/auth/v1/callback`
4. Supabase processes the OAuth and redirects to your app: `http://localhost:3000/auth/callback?code=...`
5. Your callback route exchanges the code for a session
6. User is redirected to dashboard

### 5. Debugging

If you still get "No authorization code received":

1. Check browser console for errors
2. Check server logs (the callback route logs all query params)
3. Verify the redirect URL in Supabase dashboard matches exactly
4. Make sure Google OAuth is configured correctly in Supabase
5. Check that `NEXT_PUBLIC_APP_URL` matches your actual domain

### Common Issues

- **Redirect URL mismatch**: The URL in Supabase must match exactly (including http/https, port, path)
- **Google OAuth not configured**: Make sure Google provider is enabled in Supabase
- **Wrong Google redirect URI**: Google should redirect to Supabase's callback, not your app's callback
- **Environment variables**: Make sure all Supabase env vars are set correctly

