import { supabaseAdmin } from './supabase';

export interface GoogleDriveToken {
  id: number;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  token_type: string;
  scope: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  createdTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

/**
 * Store Google Drive OAuth tokens for a user
 */
export async function storeGoogleDriveToken(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
  scope: string | null
): Promise<GoogleDriveToken | null> {
  try {
    const tokenData = {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt?.toISOString() || null,
      token_type: 'Bearer',
      scope: scope,
    };

    // Use upsert to update if exists, insert if not
    const { data, error } = await supabaseAdmin
      .from('google_drive_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing Google Drive token:', error);
      return null;
    }

    return data as GoogleDriveToken;
  } catch (error) {
    console.error('Error in storeGoogleDriveToken:', error);
    return null;
  }
}

/**
 * Get Google Drive token for current user
 */
export async function getGoogleDriveToken(userId: string): Promise<GoogleDriveToken | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('google_drive_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as GoogleDriveToken;
  } catch (error) {
    console.error('Error in getGoogleDriveToken:', error);
    return null;
  }
}

/**
 * Check if token is expired and refresh if needed
 */
export async function refreshGoogleDriveTokenIfNeeded(
  token: GoogleDriveToken
): Promise<string | null> {
  if (!token.expires_at) {
    return token.access_token;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  // If token expires in more than 5 minutes, return current token
  if (expiresAt.getTime() - now.getTime() > bufferTime) {
    return token.access_token;
  }

  // Token is expired or about to expire, need to refresh
  if (!token.refresh_token) {
    console.error('Token expired but no refresh token available');
    return null;
  }

  try {
    // Refresh the token using Google OAuth API
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Google Drive token');
      return null;
    }

    const data = await response.json();
    const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));

    // Update token in database
    await storeGoogleDriveToken(
      token.user_id,
      data.access_token,
      token.refresh_token,
      newExpiresAt,
      token.scope
    );

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Google Drive token:', error);
    return null;
  }
}

/**
 * Delete Google Drive token for a user (disconnect)
 */
export async function deleteGoogleDriveToken(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('google_drive_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting Google Drive token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGoogleDriveToken:', error);
    return false;
  }
}

/**
 * Check if user has Google Drive connected
 */
export async function isGoogleDriveConnected(userId: string): Promise<boolean> {
  const token = await getGoogleDriveToken(userId);
  return token !== null;
}

