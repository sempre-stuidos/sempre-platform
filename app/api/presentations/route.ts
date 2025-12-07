import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to get user name from user_roles.id
async function getUserNameFromRoleId(roleId: number | null): Promise<string | null> {
  if (!roleId) return null;
  
  try {
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, invited_email')
      .eq('id', roleId)
      .single();
    
    if (error || !userRole || !userRole.user_id) {
      return userRole?.invited_email || null;
    }
    
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
    if (userData?.user) {
      const metadata = userData.user.user_metadata || {};
      return metadata.full_name || metadata.name || userData.user.email?.split('@')[0] || null;
    }
    
    return userRole.invited_email || null;
  } catch (error) {
    console.error('Error fetching user name:', error);
    return null;
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
    const { title, client_id, type, status, link, description, owner_id, created_date, last_modified } = body;

    // Create the presentation
    const { data, error } = await supabase
      .from('presentations')
      .insert([{
        title,
        client_id,
        type,
        status,
        link,
        description: description || null,
        owner_id: owner_id || null,
        created_date: created_date || new Date().toISOString().split('T')[0],
        last_modified: last_modified || new Date().toISOString().split('T')[0],
      }])
      .select('*, clients!inner(name)')
      .single();

    if (error) {
      console.error('Error creating presentation:', error);
      return NextResponse.json(
        { error: 'Failed to create presentation' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to create presentation' },
        { status: 500 }
      );
    }

    // Get owner name
    const ownerName = await getUserNameFromRoleId(data.owner_id);

    // Transform to match Presentation type
    const presentation = {
      id: data.id,
      title: data.title,
      clientId: data.client_id,
      clientName: data.clients.name,
      type: data.type,
      createdDate: data.created_date,
      ownerId: data.owner_id,
      ownerName: ownerName,
      status: data.status,
      link: data.link,
      description: data.description ?? undefined,
      lastModified: data.last_modified,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ presentation });
  } catch (error) {
    console.error('Error in POST /api/presentations:', error);
    return NextResponse.json(
      { error: 'Failed to create presentation' },
      { status: 500 }
    );
  }
}

