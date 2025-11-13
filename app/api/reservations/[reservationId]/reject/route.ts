import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';

interface RouteParams {
  params: Promise<{
    reservationId: string;
  }>;
}

// Dummy email function - logs to console instead of sending actual email
function sendRejectionEmail(
  customerEmail: string,
  customerName: string,
  reservationDate: string,
  reservationTime: string
): void {
  const emailContent = `
Rejection Email (DUMMY)
========================
To: ${customerEmail}
Subject: Reservation Request Declined

Dear ${customerName},

We regret to inform you that your reservation request has been declined.

Date: ${new Date(reservationDate).toLocaleDateString('en-US', { 
  weekday: 'long',
  month: 'long', 
  day: 'numeric',
  year: 'numeric'
})}
Time: ${reservationTime}

We apologize for any inconvenience. Please feel free to contact us if you have any questions.

Best regards,
Restaurant Team
  `.trim();

  console.log('='.repeat(50));
  console.log('DUMMY EMAIL SENT:');
  console.log(emailContent);
  console.log('='.repeat(50));
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

    // Send dummy rejection email
    sendRejectionEmail(
      reservation.customer_email,
      reservation.customer_name,
      reservation.reservation_date,
      reservation.reservation_time
    );

    return NextResponse.json({ 
      success: true,
      message: 'Reservation rejected and notification email sent (dummy)'
    });
  } catch (error) {
    console.error('Error in POST /api/reservations/[reservationId]/reject:', error);
    return NextResponse.json(
      { error: 'Failed to reject reservation' },
      { status: 500 }
    );
  }
}

