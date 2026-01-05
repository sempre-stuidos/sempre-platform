import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getGalleryImages, createGalleryImage } from '@/lib/gallery';
import { getBusinessById } from '@/lib/businesses';
import { getGalleryImagesForBusiness, getFilePublicUrl } from '@/lib/files-assets';
import { getGalleryImagePublicUrl } from '@/lib/gallery-images';

interface RouteParams {
  params: Promise<{
    orgId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get business to retrieve slug
    const business = await getBusinessById(orgId, supabase);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Use the new gallery images function that works with files_assets table
    // Pass the authenticated supabase client for server-side access
    const galleryImages = await getGalleryImagesForBusiness(business.slug || undefined, supabase);

    // Transform to the format expected by the image picker
    const images = galleryImages.map((img) => {
      let imageUrl = '';
      if (img.file_url) {
        // Check if it's a gallery image
        if (img.file_url.includes('/gallery/') || img.project === 'Gallery') {
          imageUrl = getGalleryImagePublicUrl(img.file_url, supabase);
        } else {
          imageUrl = getFilePublicUrl(img.file_url, supabase);
        }
      } else if (img.google_drive_web_view_link) {
        imageUrl = img.google_drive_web_view_link;
      }

      return {
        id: img.id,
        url: imageUrl,
        name: img.name || 'Untitled',
        image_url: imageUrl,
        filename: img.name,
      };
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/gallery-images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
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

    // Get client linked to this business
    const business = await getBusinessById(orgId, supabase);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', orgId)
      .limit(1)
      .single();

    if (!clients) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { imageUrl, title, description } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const galleryImage = await createGalleryImage(clients.id, {
      imageUrl,
      title,
      description,
    }, supabase);

    if (!galleryImage) {
      return NextResponse.json(
        { error: 'Failed to create gallery image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: galleryImage }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/gallery-images:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery image' },
      { status: 500 }
    );
  }
}

