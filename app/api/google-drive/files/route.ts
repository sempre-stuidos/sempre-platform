import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getGoogleDriveToken, refreshGoogleDriveTokenIfNeeded } from '@/lib/google-drive';
import type { GoogleDriveFile } from '@/lib/google-drive';

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

    // Get Google Drive token
    const token = await getGoogleDriveToken(user.id);
    if (!token) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 400 }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshGoogleDriveTokenIfNeeded(token);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to refresh Google Drive token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageToken = searchParams.get('pageToken') || undefined;
    const q = searchParams.get('q') || undefined;

    // Build Google Drive API request
    const driveApiUrl = new URL('https://www.googleapis.com/drive/v3/files');
    // Include thumbnailLink for image previews - need to use alt=media for images
    driveApiUrl.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, modifiedTime, createdTime, thumbnailLink, iconLink)');
    driveApiUrl.searchParams.set('pageSize', '50');
    
    if (pageToken) {
      driveApiUrl.searchParams.set('pageToken', pageToken);
    }

    // Filter for common file types (documents, images, PDFs, etc.)
    const fileTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (q) {
      driveApiUrl.searchParams.set('q', q);
    } else {
      // Default query: show files that are not trashed
      const defaultQuery = `trashed=false and (${fileTypes.map(type => `mimeType='${type}'`).join(' or ')})`;
      driveApiUrl.searchParams.set('q', defaultQuery);
    }

    // Fetch files from Google Drive
    const response = await fetch(driveApiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Drive API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch files from Google Drive' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      files: data.files || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files from Google Drive' },
      { status: 500 }
    );
  }
}

