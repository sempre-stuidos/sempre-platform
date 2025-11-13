import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';

interface RouteParams {
  params: Promise<{
    reservationId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reservationId } = await params;
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

    // Get the reservation to check org_id
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, reservation.org_id, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, archiving will just delete the reservation
    // In a production app, you might want to add an 'archived' status or move to an archive table
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (deleteError) {
      console.error('Error archiving reservation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to archive reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Reservation archived successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/reservations/[reservationId]/archive:', error);
    return NextResponse.json(
      { error: 'Failed to archive reservation' },
      { status: 500 }
    );
  }
}

