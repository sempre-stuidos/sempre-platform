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

    // Check if reservation is already completed or cancelled
    if (reservation.status === 'completed') {
      return NextResponse.json(
        { error: 'Reservation is already completed' },
        { status: 400 }
      );
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot complete a cancelled reservation' },
        { status: 400 }
      );
    }

    // Update reservation status to completed
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark reservation as completed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Reservation marked as completed'
    });
  } catch (error) {
    console.error('Error in POST /api/reservations/[reservationId]/complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark reservation as completed' },
      { status: 500 }
    );
  }
}

