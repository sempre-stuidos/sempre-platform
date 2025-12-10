import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { sendReservationRejectionEmail } from '@/lib/email';

interface RouteParams {
  params: Promise<{
    reservationId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reservationId } = await params;
    const body = await request.json();
    const { rejectionReason, sendEmail } = body;
    
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

    // Get the reservation to check org_id and get customer details
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

    // Check if reservation is already cancelled or completed
    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      return NextResponse.json(
        { error: 'Reservation is already cancelled or completed' },
        { status: 400 }
      );
    }

    // Update reservation status to cancelled
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject reservation' },
        { status: 500 }
      );
    }

    // Send rejection email if requested
    if (sendEmail && rejectionReason) {
      const emailResult = await sendReservationRejectionEmail({
        customerEmail: reservation.customer_email,
        customerName: reservation.customer_name,
        reservationDate: reservation.reservation_date,
        reservationTime: reservation.reservation_time,
        rejectionReason: rejectionReason,
      });

      if (!emailResult.success) {
        // Log error but don't fail the rejection
        console.error('Failed to send rejection email:', emailResult.error);
      }

      return NextResponse.json({ 
        success: true,
        message: emailResult.success 
          ? 'Reservation rejected and customer notified' 
          : 'Reservation rejected, but email sending failed'
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Reservation rejected'
    });
  } catch (error) {
    console.error('Error in POST /api/reservations/[reservationId]/reject:', error);
    return NextResponse.json(
      { error: 'Failed to reject reservation' },
      { status: 500 }
    );
  }
}

