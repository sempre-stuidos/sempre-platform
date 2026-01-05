import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getGalleryImagePublicUrl } from '@/lib/gallery-images';
import { createFilesAssets } from '@/lib/files-assets';

interface RouteParams {
  params: Promise<{
    orgId: string;
    productId: string;
  }>;
}

// GET - Fetch product images
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, productId } = await params;
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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the product belongs to this org
    const { data: existingProduct, error: fetchError } = await supabase
      .from('retail_products_table')
      .select('business_id, name')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct || existingProduct.business_id !== orgId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch images linked to this product
    const { data: images, error: imagesError } = await supabase
      .from('files_assets')
      .select('*')
      .eq('type', 'Images')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Error fetching product images:', imagesError);
      return NextResponse.json({ images: [] });
    }

    // Transform images to include public URLs
    const transformedImages = (images || []).map((img) => {
      let imageUrl = img.file_url || '';
      // If file_url is a storage path, convert to public URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = getGalleryImagePublicUrl(imageUrl, supabase);
      }
      return {
        id: img.id,
        name: img.name,
        url: imageUrl,
        file_url: img.file_url,
        created_at: img.created_at,
      };
    });

    return NextResponse.json({ images: transformedImages });
  } catch (error) {
    console.error('Error in GET /api/products/[orgId]/[productId]/images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product images' },
      { status: 500 }
    );
  }
}

// PUT - Link images to product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, productId } = await params;
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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the product belongs to this org
    const { data: existingProduct, error: fetchError } = await supabase
      .from('retail_products_table')
      .select('business_id, name')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct || existingProduct.business_id !== orgId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const { imageUrls, productName } = body;

    if (!Array.isArray(imageUrls)) {
      return NextResponse.json({ error: 'imageUrls must be an array' }, { status: 400 });
    }

    // Get business slug
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', orgId)
      .single();

    const businessSlug = business?.slug || orgId;
    const sanitizedSlug = businessSlug.replace(/[^a-zA-Z0-9-_]/g, '-');
    const sanitizedProductName = productName 
      ? productName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
      : 'products';

    // Update existing images to link them to this product
    // Find images by matching their URLs to storage paths
    const updatedImages = []
    for (const imageUrl of imageUrls) {
      // Extract storage path from URL if it's a public URL
      let storagePath = imageUrl
      if (imageUrl.includes('/storage/v1/object/public/gallery/')) {
        // Extract path after /gallery/
        const pathMatch = imageUrl.match(/\/gallery\/(.+)$/)
        if (pathMatch) {
          storagePath = pathMatch[1]
        }
      }

      // Find the file_asset by file_url
      const { data: fileAsset } = await supabase
        .from('files_assets')
        .select('*')
        .eq('file_url', storagePath)
        .single();

      if (fileAsset) {
        // Update the file_asset to link it to this product
        const { error: updateError } = await supabase
          .from('files_assets')
          .update({
            product_id: productId,
            project: productName || existingProduct.name, // Update project to product name
          })
          .eq('id', fileAsset.id);

        if (!updateError) {
          updatedImages.push(fileAsset.id)
        }
      } else {
        // If file_asset doesn't exist, create it
        // This handles the case where images were uploaded but not yet linked
        try {
          const fileSize = 'Unknown'
          const fileFormat = storagePath.split('.').pop()?.toUpperCase() || 'IMAGE'
          const uploadedDate = new Date().toISOString().split('T')[0]
          const nameWithoutExtension = storagePath.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'Product Image'

          await createFilesAssets({
            name: nameWithoutExtension,
            type: "Images",
            category: "Client Assets",
            project: productName || existingProduct.name,
            size: fileSize,
            format: fileFormat,
            uploaded: uploadedDate,
            status: "Active",
            file_url: storagePath,
            product_id: productId,
          });
        } catch (error) {
          console.error('Error creating file asset for product image:', error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedImages.length 
    });
  } catch (error) {
    console.error('Error in PUT /api/products/[orgId]/[productId]/images:', error);
    return NextResponse.json(
      { error: 'Failed to link images to product' },
      { status: 500 }
    );
  }
}

