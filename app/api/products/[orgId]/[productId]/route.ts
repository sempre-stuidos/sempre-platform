import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { Product, transformProductRecord } from '@/lib/products';

interface RouteParams {
  params: Promise<{
    orgId: string;
    productId: string;
  }>;
}

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

    const { data, error } = await supabase
      .from('retail_products_table')
      .select('*')
      .eq('id', productId)
      .eq('business_id', orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: transformProductRecord(data) });
  } catch (error) {
    console.error('Error in GET /api/products/[orgId]/[productId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { 
      name, price, original_price, sku, status, category, stock, rating, 
      image_url, description, benefits, ingredients, how_to_use, 
      sizes, badges, review_count 
    } = body;

    // Validate name if provided (for updates, name is optional but if provided must not be empty)
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Product name cannot be empty' },
        { status: 400 }
      );
    }

    // Verify the product belongs to this org
    const { data: existingProduct, error: fetchError } = await supabase
      .from('retail_products_table')
      .select('business_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct || existingProduct.business_id !== orgId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price !== null ? price : null;
    if (original_price !== undefined) updateData.original_price = original_price !== null ? original_price : null;
    if (sku !== undefined) updateData.sku = sku || null;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category || null;
    if (stock !== undefined) updateData.stock = stock !== null ? stock : null;
    if (rating !== undefined) updateData.rating = rating !== null ? rating : null;
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (description !== undefined) updateData.description = description || null;
    if (benefits !== undefined) {
      updateData.benefits = benefits && Array.isArray(benefits) && benefits.length > 0 ? benefits : null;
    }
    if (ingredients !== undefined) {
      updateData.ingredients = ingredients && Array.isArray(ingredients) && ingredients.length > 0 ? ingredients : null;
    }
    if (how_to_use !== undefined) updateData.how_to_use = how_to_use || null;
    if (sizes !== undefined) {
      updateData.sizes = sizes && Array.isArray(sizes) && sizes.length > 0 ? sizes : null;
    }
    if (badges !== undefined) {
      updateData.badges = badges && Array.isArray(badges) && badges.length > 0 ? badges : null;
    }
    if (review_count !== undefined) updateData.review_count = review_count !== null ? review_count : null;

    const { data, error } = await supabase
      .from('retail_products_table')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: transformProductRecord(data) });
  } catch (error) {
    console.error('Error in PATCH /api/products/[orgId]/[productId]:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      .select('business_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct || existingProduct.business_id !== orgId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('retail_products_table')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/products/[orgId]/[productId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

