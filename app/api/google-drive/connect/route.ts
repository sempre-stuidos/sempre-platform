import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Google OAuth credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.json(
        { error: 'Google Drive integration not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' },
        { status: 500 }
      );
    }

    // Get the base URL - ensure it matches exactly what's configured in Google Cloud Console
    const baseUrl = request.nextUrl.origin;
    // Remove trailing slash if present and ensure exact match with Google Cloud Console
    const callbackUrl = `${baseUrl.replace(/\/$/, '')}/api/google-drive/callback`;

    // Log the redirect URI for debugging (remove in production if needed)
    console.log('Google OAuth redirect_uri:', callbackUrl);
    console.log('Make sure this EXACT URL is added to Google Cloud Console authorized redirect URIs');

    // Request Google Drive API scopes
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ');

    // Generate a random state for security, include return URL if from files-assets
    const returnUrl = request.nextUrl.searchParams.get('return_url') || '/files-assets';
    const state = Buffer.from(JSON.stringify({ userId: user.id, returnUrl })).toString('base64');

    // Build Google OAuth URL directly (not through Supabase)
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
    authUrl.searchParams.set('state', state);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error in Google Drive connect:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Drive connection' },
      { status: 500 }
    );
  }
}

