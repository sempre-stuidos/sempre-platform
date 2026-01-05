import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { Blog, transformBlogRecord, generateSlug, calculateReadTime } from '@/lib/blogs';

interface RouteParams {
  params: Promise<{
    orgId: string;
    blogId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, blogId } = await params;
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
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .eq('business_id', orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ blog: transformBlogRecord(data) });
  } catch (error) {
    console.error('Error in GET /api/blogs/[orgId]/[blogId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, blogId } = await params;
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
      title, excerpt, content, image_url, author, category, tags,
      status, seo_title, seo_description, slug: providedSlug
    } = body;

    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json(
        { error: 'Blog title cannot be empty' },
        { status: 400 }
      );
    }

    // Validate content if provided
    if (content !== undefined && (!content || !content.trim())) {
      return NextResponse.json(
        { error: 'Blog content cannot be empty' },
        { status: 400 }
      );
    }

    // Verify the blog belongs to this org
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('business_id, slug, title, published_at')
      .eq('id', blogId)
      .single();

    if (fetchError || !existingBlog || existingBlog.business_id !== orgId) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) {
      updateData.title = title.trim();
      // If title changed and no slug provided, regenerate slug
      if (!providedSlug && title.trim() !== existingBlog.title) {
        let newSlug = generateSlug(title.trim());
        // Ensure slug is unique
        let uniqueSlug = newSlug;
        let counter = 1;
        while (uniqueSlug === existingBlog.slug || true) {
          const { data: existing } = await supabase
            .from('blogs')
            .select('id')
            .eq('business_id', orgId)
            .eq('slug', uniqueSlug)
            .neq('id', blogId)
            .single();
          
          if (!existing) {
            break; // Slug is unique
          }
          
          uniqueSlug = `${newSlug}-${counter}`;
          counter++;
        }
        updateData.slug = uniqueSlug;
      }
    }
    
    if (providedSlug !== undefined && providedSlug !== existingBlog.slug) {
      // Check if provided slug is unique
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('business_id', orgId)
        .eq('slug', providedSlug)
        .neq('id', blogId)
        .single();
      
      if (existing) {
        return NextResponse.json(
          { error: 'Slug already exists for this business' },
          { status: 400 }
        );
      }
      
      updateData.slug = providedSlug;
    }
    
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (content !== undefined) {
      updateData.content = content.trim();
      // Recalculate read time if content changed
      updateData.read_time = calculateReadTime(content);
    }
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (author !== undefined) updateData.author = author || null;
    if (category !== undefined) updateData.category = category || null;
    if (tags !== undefined) {
      updateData.tags = tags && Array.isArray(tags) && tags.length > 0 ? tags : null;
    }
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at when status changes to published
      if (status === 'published' && !existingBlog.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      // Clear published_at when status changes from published
      if (status !== 'published' && existingBlog.published_at) {
        updateData.published_at = null;
      }
    }
    if (seo_title !== undefined) updateData.seo_title = seo_title || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description || null;

    const { data, error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog:', error);
      return NextResponse.json(
        { error: 'Failed to update blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog: transformBlogRecord(data) });
  } catch (error) {
    console.error('Error in PATCH /api/blogs/[orgId]/[blogId]:', error);
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, blogId } = await params;
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

    // Verify the blog belongs to this org
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('business_id')
      .eq('id', blogId)
      .single();

    if (fetchError || !existingBlog || existingBlog.business_id !== orgId) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId);

    if (error) {
      console.error('Error deleting blog:', error);
      return NextResponse.json(
        { error: 'Failed to delete blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/blogs/[orgId]/[blogId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    );
  }
}

