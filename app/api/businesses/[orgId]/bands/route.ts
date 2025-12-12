import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { Band } from '@/lib/types';

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

    const { data: bands, error } = await supabase
      .from('bands')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching bands:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bands' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bands: bands || [] });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/bands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bands' },
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

    const body = await request.json();
    const { name, description, image_url } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Band name is required' },
        { status: 400 }
      );
    }

    // Verify the business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', orgId)
      .single();

    if (businessError || !business) {
      console.error('Error verifying business:', businessError);
      return NextResponse.json(
        { error: 'Business not found', details: businessError?.message },
        { status: 404 }
      );
    }

    const { data: band, error } = await supabase
      .from('bands')
      .insert({
        org_id: orgId,
        name: name.trim(),
        description: description?.trim() || null,
        image_url: image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating band:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The bands table does not exist. Please run the database migration: supabase db push',
            code: error.code,
            hint: 'Run: supabase db push or apply migration 20250118000000_create_bands_tables.sql'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create band', 
          details: error.message || 'Unknown error',
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ band }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/bands:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create band';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
