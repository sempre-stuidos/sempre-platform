import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';

interface RouteParams {
  params: Promise<{
    reservationId: string;
  }>;
}

// Dummy email function - logs to console instead of sending actual email
function sendConfirmationEmail(
  customerEmail: string,
  customerName: string,
  reservationDate: string,
  reservationTime: string
): void {
  const emailContent = `
Confirmation Email (DUMMY)
==========================
To: ${customerEmail}
Subject: Reservation Confirmed

Dear ${customerName},

Your reservation has been confirmed!

Date: ${new Date(reservationDate).toLocaleDateString('en-US', { 
  weekday: 'long',
  month: 'long', 
  day: 'numeric',
  year: 'numeric'
})}
Time: ${reservationTime}

We look forward to serving you!

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

    // Check if reservation is already approved or completed
    if (reservation.status === 'approved' || reservation.status === 'completed') {
      return NextResponse.json(
        { error: 'Reservation is already approved or completed' },
        { status: 400 }
      );
    }

    // Get user's name for approved_by field
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const approverName = profile?.full_name || user.email?.split('@')[0] || 'Restaurant Staff';

    // Update reservation status
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'approved',
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Error updating reservation:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        reservationId,
        orgId: reservation.org_id,
        userId: user.id,
      });
      return NextResponse.json(
        { 
          error: 'Failed to approve reservation',
          details: updateError.message || 'Unknown error',
          code: updateError.code
        },
        { status: 500 }
      );
    }

    // Send dummy confirmation email
    sendConfirmationEmail(
      reservation.customer_email,
      reservation.customer_name,
      reservation.reservation_date,
      reservation.reservation_time
    );

    return NextResponse.json({ 
      success: true,
      message: 'Reservation approved and confirmation email sent (dummy)'
    });
  } catch (error) {
    console.error('Error in POST /api/reservations/[reservationId]/approve:', error);
    return NextResponse.json(
      { error: 'Failed to approve reservation' },
      { status: 500 }
    );
  }
}

