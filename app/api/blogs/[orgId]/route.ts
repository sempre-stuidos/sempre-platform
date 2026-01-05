import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { Blog, transformBlogRecord, generateSlug, calculateReadTime } from '@/lib/blogs';

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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get status filter from query params if provided
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('blogs')
      .select('*')
      .eq('business_id', orgId)
      .order('created_at', { ascending: false });

    if (statusFilter && ['draft', 'published', 'archived'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blogs:', error);
      return NextResponse.json({ blogs: [] });
    }

    const blogs = data ? data.map(transformBlogRecord) : [];
    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Error in GET /api/blogs/[orgId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
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

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Blog title is required' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Blog content is required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    let blogSlug = providedSlug || generateSlug(title);
    
    // Ensure slug is unique for this business
    let uniqueSlug = blogSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('business_id', orgId)
        .eq('slug', uniqueSlug)
        .single();
      
      if (!existing) {
        break; // Slug is unique
      }
      
      uniqueSlug = `${blogSlug}-${counter}`;
      counter++;
    }

    // Calculate read time
    const readTime = calculateReadTime(content);

    // Determine published_at timestamp
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        business_id: orgId,
        title: title.trim(),
        slug: uniqueSlug,
        excerpt: excerpt || null,
        content: content.trim(),
        image_url: image_url || null,
        author: author || null,
        category: category || null,
        tags: tags && Array.isArray(tags) && tags.length > 0 ? tags : null,
        status: status || 'draft',
        published_at: publishedAt,
        read_time: readTime,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog:', error);
      return NextResponse.json(
        { error: 'Failed to create blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog: transformBlogRecord(data) }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/blogs/[orgId]:', error);
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 }
    );
  }
}

