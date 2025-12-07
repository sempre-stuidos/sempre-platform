import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAllTeamMembers } from '@/lib/team';

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

    // Get all team members using server-side function (uses supabaseAdmin)
    const teamMembers = await getAllTeamMembers();
    
    // Transform to the format expected by the component
    const formattedMembers = teamMembers.map(member => ({
      id: member.id,
      name: member.name || 'Unknown',
      isCurrentUser: member.auth_user_id === user.id
    }));

    return NextResponse.json({ teamMembers: formattedMembers });
  } catch (error) {
    console.error('Error in GET /api/team-members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

