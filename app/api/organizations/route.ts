import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserOrganizations, getAllOrganizations, createOrganization } from '@/lib/organizations';
import { ensureProfileExists } from '@/lib/profiles';
import { getUserRole } from '@/lib/invitations';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Ensure profile exists
    await ensureProfileExists(user.id);

    // Check if user is Admin
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';

    // If admin, return all organizations; otherwise return user's organizations
    let organizations;
    if (isAdmin) {
      organizations = await getAllOrganizations();
    } else {
      organizations = await getUserOrganizations(user.id, supabase);
    }

    console.log('GET /api/organizations - User ID:', user.id);
    console.log('GET /api/organizations - Is Admin:', isAdmin);
    console.log('GET /api/organizations - Found organizations:', organizations.length);

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { name, type, description, address, phone, email, website, logo_url, status } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['agency', 'restaurant', 'hotel', 'retail', 'service', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Ensure profile exists
    await ensureProfileExists(user.id);

    // Create organization
    const result = await createOrganization(
      name, 
      type, 
      user.id, 
      description, 
      address, 
      phone, 
      email, 
      website, 
      logo_url, 
      status
    );

    if (!result.success) {
      console.error('Failed to create organization:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: result.organization }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

