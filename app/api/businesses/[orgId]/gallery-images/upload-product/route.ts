import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getGalleryImagePublicUrl } from '@/lib/gallery-images';
import { createFilesAssets } from '@/lib/files-assets';

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

    // Get business to get slug
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', orgId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessSlug = business.slug || orgId;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productName = formData.get('productName') as string | null;
    const productId = formData.get('productId') as string | null;

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

    // Sanitize business slug and product name for folder structure
    const sanitizedSlug = businessSlug.replace(/[^a-zA-Z0-9-_]/g, '-');
    const sanitizedProductName = productName 
      ? productName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
      : 'products';
    
    // Create unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Storage path: business-slug/gallery/product-name/filename
    const filePath = `${sanitizedSlug}/gallery/${sanitizedProductName}/${fileName}`;

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

    // Create database record if product name is provided
    if (productName) {
      try {
        const fileSize = `${(file.size / 1024).toFixed(2)} KB`;
        const fileFormat = file.type.split('/')[1].toUpperCase();
        const uploadedDate = new Date().toISOString().split('T')[0];
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");

        await createFilesAssets({
          name: nameWithoutExtension,
          type: "Images",
          category: "Client Assets",
          project: productName, // Use product name as project (creates folder)
          size: fileSize,
          format: fileFormat,
          uploaded: uploadedDate,
          status: "Active",
          file_url: data.path, // Store the storage path
          product_id: productId || undefined,
        });
      } catch (error) {
        console.error('Error creating file asset record:', error);
        // Don't fail the upload if database record creation fails
      }
    }

    return NextResponse.json({ imageUrl, filePath: data.path });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/gallery-images/upload-product:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

