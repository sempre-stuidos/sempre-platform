import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getGoogleDriveToken, refreshGoogleDriveTokenIfNeeded } from '@/lib/google-drive';
import { createFilesAssets } from '@/lib/files-assets';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { fileId, projectName, category } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get file metadata from Google Drive
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,webContentLink,modifiedTime,createdTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file from Google Drive' },
        { status: fileResponse.status }
      );
    }

    const fileData = await fileResponse.json();

    // Determine file type based on MIME type
    const mimeTypeToType: Record<string, 'Logo' | 'Document' | 'Mockup' | 'Content' | 'Images' | 'Wireframe' | 'Prototype' | 'Templates' | 'Video' | 'Design System' | 'Icons' | 'Presentation' | 'Template'> = {
      'application/vnd.google-apps.document': 'Document',
      'application/vnd.google-apps.spreadsheet': 'Document',
      'application/vnd.google-apps.presentation': 'Presentation',
      'application/pdf': 'Document',
      'image/jpeg': 'Images',
      'image/png': 'Images',
      'image/gif': 'Images',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentation',
    };

    const fileType = mimeTypeToType[fileData.mimeType] || 'Document';
    const fileSize = fileData.size ? `${(parseInt(fileData.size) / 1024).toFixed(2)} KB` : 'Unknown';
    const fileFormat = fileData.mimeType.split('/').pop()?.toUpperCase() || 'UNKNOWN';

    // Create file record in database
    const newFile = await createFilesAssets({
      name: fileData.name,
      type: fileType,
      category: (category || 'Project Assets') as 'Client Assets' | 'Project Assets',
      project: projectName || 'Unassigned',
      size: fileSize,
      format: fileFormat,
      uploaded: new Date().toISOString().split('T')[0],
      status: 'Active',
      file_url: fileData.webViewLink || fileData.webContentLink || null,
      google_drive_file_id: fileData.id,
      google_drive_web_view_link: fileData.webViewLink || null,
      imported_from_google_drive: true,
    });

    if (!newFile) {
      return NextResponse.json(
        { error: 'Failed to import file' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, file: newFile });
  } catch (error) {
    console.error('Error importing Google Drive file:', error);
    return NextResponse.json(
      { error: 'Failed to import file from Google Drive' },
      { status: 500 }
    );
  }
}

