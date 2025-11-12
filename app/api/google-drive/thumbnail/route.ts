import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getGoogleDriveToken, refreshGoogleDriveTokenIfNeeded } from '@/lib/google-drive';

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

    // Get file ID from query params
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const size = searchParams.get('size') || '200';

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Fetch thumbnail from Google Drive API
    const thumbnailUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/thumbnail?sz=${size}`;
    const response = await fetch(thumbnailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If thumbnail doesn't exist, try to get the file and use webContentLink
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink,mimeType`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.webContentLink && fileData.mimeType?.includes('image')) {
          // Redirect to the content link
          return NextResponse.redirect(fileData.webContentLink);
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch thumbnail' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching Google Drive thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    );
  }
}

