# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration so users can import files from their Google Drive accounts.

## Prerequisites

1. Google Cloud Console account
2. Supabase project (local or cloud)
3. Google OAuth credentials configured in Supabase

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google Drive API"
   - Click **Enable**

4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - **IMPORTANT**: Add authorized redirect URIs (must match EXACTLY, including protocol and no trailing slash):
     - For local development: `http://localhost:3000/api/google-drive/callback`
     - For production: `https://yourdomain.com/api/google-drive/callback` (replace with your actual domain)
   - **Note**: The redirect URI must be EXACTLY the same as what the app uses. Check your server logs for the exact redirect_uri being used.
   - Save and note your **Client ID** and **Client Secret**

5. Configure OAuth Consent Screen (REQUIRED):
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (unless you have a Google Workspace account, then choose **Internal**)
   - Fill in the required information:
     - App name: Your app name (e.g., "Sempre Studios")
     - User support email: Your email
     - Developer contact information: Your email
   - Click **Save and Continue**
   - On **Scopes** page, click **Add or Remove Scopes** and add:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.file`
   - Click **Save and Continue**
   - On **Test users** page (IMPORTANT for development):
     - Click **Add Users**
     - Add your email address (and any other test users)
     - Click **Add**
   - Click **Save and Continue** through the remaining steps
   - **Note**: While in "Testing" mode, only added test users can access the app

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth Credentials (for Google Drive API)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Configure Supabase (Optional - for provider tokens)

If you want Supabase to return provider tokens in the session:

1. Go to your Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Make sure Google provider is enabled
3. Add your Google OAuth credentials
4. In the **Advanced Settings**, ensure **Return provider tokens** is enabled (if available)

**Note**: If Supabase doesn't support returning provider tokens, the integration will use a direct Google OAuth flow instead.

## Step 4: Apply Database Migrations

The migrations have already been applied, but if you need to apply them manually:

```bash
# For local Supabase
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/migrations/20250126000000_add_google_drive_integration.sql

# For cloud Supabase, use the Supabase dashboard SQL editor or CLI
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to your dashboard
3. Look for the Google Drive connection component
4. Click "Connect Google Drive"
5. Authorize the application
6. You should be redirected back with a success message
7. Try importing files from Google Drive

## How It Works

1. **User clicks "Connect Google Drive"**:
   - Redirects to `/api/google-drive/connect`
   - Initiates OAuth flow with Google Drive scopes
   - User authorizes access

2. **OAuth Callback**:
   - Google redirects to `/api/google-drive/callback` with authorization code
   - Code is exchanged for access/refresh tokens
   - Tokens are stored securely in the database (encrypted)

3. **Importing Files**:
   - User opens the import modal
   - Files are fetched from Google Drive API
   - User selects files to import
   - Files are imported and stored in the database with Google Drive metadata

## Security Features

- **Row Level Security (RLS)**: Users can only access their own Google Drive tokens
- **Token Encryption**: Tokens are stored securely in the database
- **Automatic Token Refresh**: Tokens are automatically refreshed when expired
- **Private Access**: Each user only sees their own Google Drive files

## Troubleshooting

### "Error 403: access_denied" - App not verified / Testing mode
**This error means your OAuth app is in "Testing" mode and your email isn't added as a test user.**

**Solution:**
1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Scroll down to the **Test users** section
3. Click **Add Users**
4. Enter your email address (the one you're trying to sign in with, e.g., `yolxanderjaca@gmail.com`)
5. Click **Add**
6. Wait a few minutes for changes to propagate
7. Try connecting again

**Alternative: Publish the App (for production use)**
- In **OAuth consent screen**, click **PUBLISH APP**
- Note: Publishing requires Google verification if you're using sensitive scopes
- For development, adding test users is easier

### "Error 400: redirect_uri_mismatch"
**This is the most common error!** The redirect URI in your request must EXACTLY match what's configured in Google Cloud Console.

**Solution:**
1. Check your server console logs - it will show the exact `redirect_uri` being used
2. Go to Google Cloud Console → **APIs & Services** → **Credentials** → Your OAuth 2.0 Client
3. Click **Edit** on your OAuth client
4. Under **Authorized redirect URIs**, add the EXACT URL from your logs (including `http://` or `https://`, no trailing slash)
5. Common formats:
   - Local: `http://localhost:3000/api/google-drive/callback`
   - Production: `https://yourdomain.com/api/google-drive/callback`
6. Save and wait a few minutes for changes to propagate
7. Try connecting again

**Important Notes:**
- The redirect URI is case-sensitive
- No trailing slashes allowed
- Must include the full path: `/api/google-drive/callback`
- Protocol must match (`http://` for local, `https://` for production)

### "Google Drive not connected" error
- Make sure you've completed the OAuth flow
- Check that tokens are stored in the `google_drive_tokens` table
- Verify RLS policies allow the user to access their tokens

### "Failed to fetch files" error
- Check that Google Drive API is enabled in Google Cloud Console
- Verify OAuth credentials are correct
- Check that the access token hasn't expired

### Token refresh issues
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Check that refresh token is stored in the database
- Verify network connectivity to Google OAuth API

## API Endpoints

- `GET /api/google-drive/connect` - Initiate OAuth flow
- `GET /api/google-drive/callback` - Handle OAuth callback
- `GET /api/google-drive/status` - Check connection status
- `POST /api/google-drive/disconnect` - Disconnect Google Drive
- `GET /api/google-drive/files` - List files from Google Drive
- `POST /api/google-drive/import` - Import a file from Google Drive

## Components

- `GoogleDriveConnect` - Component for connecting/disconnecting Google Drive
- `GoogleDriveImportModal` - Modal for browsing and importing files

