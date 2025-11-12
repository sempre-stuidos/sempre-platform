import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { storeGoogleDriveToken } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const state = requestUrl.searchParams.get('state'); // Contains user_id if we passed it

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
    }

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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Exchange authorization code for tokens directly with Google
    // This is necessary because Supabase doesn't always return provider tokens
    // IMPORTANT: redirect_uri must EXACTLY match what's configured in Google Cloud Console
    const redirectUri = `${requestUrl.origin.replace(/\/$/, '')}/api/google-drive/callback`;
    
    console.log('Token exchange redirect_uri:', redirectUri);
    console.log('This must EXACTLY match the redirect URI in Google Cloud Console');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Failed to exchange code for tokens:', errorData);
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const scope = tokenData.scope || null;

    // Store the token
    await storeGoogleDriveToken(
      user.id,
      accessToken,
      refreshToken,
      expiresAt,
      scope
    );

    // Check if we have a return URL in state, otherwise default to files-assets
    let redirectUrl = '/files-assets?google_drive_connected=true&open_import=true';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        if (stateData.returnUrl) {
          redirectUrl = `${stateData.returnUrl}?google_drive_connected=true&open_import=true`;
        }
      }
    } catch (e) {
      // If state parsing fails, use default
    }

    // Redirect to files-assets with success message and flag to open import modal
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in Google Drive callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=connection_failed', request.url));
  }
}

