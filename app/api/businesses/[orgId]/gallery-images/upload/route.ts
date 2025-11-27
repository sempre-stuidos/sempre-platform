import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getGalleryImagePublicUrl } from '@/lib/gallery-images';

interface RouteParams {
  params: Promise<{
    orgId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
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

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Sanitize org ID for folder structure
    const sanitizedOrgId = orgId.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Create unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Storage path: org-id/filename (in gallery bucket)
    const filePath = `${sanitizedOrgId}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image to gallery bucket:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const imageUrl = getGalleryImagePublicUrl(data.path, supabase);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/gallery-images/upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

