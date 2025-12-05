import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/businesses';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { ReservationsList } from '@/components/reservations-list';

interface ReservationsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function ReservationsPage({ params }: ReservationsPageProps) {
  const { orgId } = await params;
  const cookieStore = await cookies();
  
  const supabaseServer = createServerClient(
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

  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect('/client/login');
  }

  // Verify organization membership
  const role = await getUserRoleInOrg(user.id, orgId, supabaseAdmin);
  if (!role) {
    redirect('/client/select-org');
  }

  // Get organization details
  const organization = await getOrganizationById(orgId, supabaseAdmin);
  if (!organization) {
    redirect('/client/select-org');
  }

  // Fetch reservations for this organization
  const { data: reservations, error } = await supabaseServer
    .from('reservations')
    .select('*')
    .eq('org_id', orgId)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true });

  if (error) {
    console.error('Error fetching reservations:', error);
  }

  // Use only real reservations from database
  const allReservations = reservations || [];

  // Separate upcoming and past reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = allReservations.filter((reservation) => {
    const reservationDate = new Date(reservation.reservation_date);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate >= today;
  });

  const pastReservations = allReservations.filter((reservation) => {
    const reservationDate = new Date(reservation.reservation_date);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate < today;
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <ReservationsList
          upcomingReservations={upcomingReservations || []}
          pastReservations={pastReservations || []}
        />
      </div>
    </div>
  );
}

