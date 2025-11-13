import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { redirect } from 'next/navigation';
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
  const role = await getUserRoleInOrg(user.id, orgId, supabaseServer);
  if (!role) {
    redirect('/client/select-org');
  }

  // Get organization details
  const organization = await getOrganizationById(orgId, supabaseServer);
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

  // Generate dummy data if no reservations exist
  const generateDummyReservations = () => {
    const today = new Date();
    const dummyReservations = [];
    const customerNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 
      'David Wilson', 'Jessica Martinez', 'Christopher Anderson', 'Amanda Taylor',
      'Matthew Thomas', 'Lauren Jackson', 'Daniel White', 'Rachel Harris',
      'James Martin', 'Nicole Thompson', 'Robert Garcia'
    ];
    const customerEmails = [
      'john.smith@email.com', 'sarah.j@email.com', 'michael.b@email.com', 'emily.d@email.com',
      'david.w@email.com', 'jessica.m@email.com', 'chris.a@email.com', 'amanda.t@email.com',
      'matthew.t@email.com', 'lauren.j@email.com', 'daniel.w@email.com', 'rachel.h@email.com',
      'james.m@email.com', 'nicole.t@email.com', 'robert.g@email.com'
    ];
    const customerPhones = [
      '555-0101', '555-0102', '555-0103', '555-0104', '555-0105',
      '555-0106', '555-0107', '555-0108', '555-0109', '555-0110',
      '555-0111', '555-0112', '555-0113', '555-0114', '555-0115'
    ];
    const times = ['18:00:00', '18:30:00', '19:00:00', '19:30:00', '20:00:00', '20:30:00', '21:00:00', '17:30:00', '17:00:00'];
    const statuses: Array<'pending' | 'approved' | 'cancelled' | 'completed'> = ['pending', 'approved', 'completed', 'cancelled'];
    const specialRequests = ['Window seat preferred', 'Birthday celebration', 'Anniversary dinner', null, null, null];

    for (let i = 0; i < 15; i++) {
      const reservationDate = new Date(today);
      if (i < 8) {
        // Upcoming reservations
        reservationDate.setDate(today.getDate() + i);
      } else {
        // Past reservations
        reservationDate.setDate(today.getDate() - (i - 7));
      }

      const status = statuses[i % statuses.length];
      const timeIndex = i % times.length;

      dummyReservations.push({
        id: i + 1,
        customer_name: customerNames[i],
        customer_email: customerEmails[i],
        customer_phone: customerPhones[i],
        reservation_date: reservationDate.toISOString().split('T')[0],
        reservation_time: times[timeIndex],
        party_size: 2 + (i % 6),
        status: status,
        special_requests: specialRequests[i % specialRequests.length],
        approved_by: status === 'approved' || status === 'completed' ? 'Restaurant Staff' : null,
        approved_at: status === 'approved' || status === 'completed' 
          ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString() 
          : null,
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Add 7 reservations for November 14, 2025 (Friday)
    const nov14 = new Date('2025-11-14');
    const nov14Reservations = [
      {
        id: 16,
        customer_name: 'Alexandra Chen',
        customer_email: 'alexandra.chen@email.com',
        customer_phone: '555-0116',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '18:00:00',
        party_size: 4,
        status: 'approved' as const,
        special_requests: 'Anniversary dinner',
        approved_by: 'Restaurant Staff',
        approved_at: new Date().toISOString(),
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 17,
        customer_name: 'Benjamin Rodriguez',
        customer_email: 'benjamin.r@email.com',
        customer_phone: '555-0117',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '19:30:00',
        party_size: 2,
        status: 'pending' as const,
        special_requests: null,
        approved_by: null,
        approved_at: null,
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 18,
        customer_name: 'Sophie Williams',
        customer_email: 'sophie.w@email.com',
        customer_phone: '555-0118',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '20:00:00',
        party_size: 6,
        status: 'approved' as const,
        special_requests: 'Birthday celebration',
        approved_by: 'Restaurant Staff',
        approved_at: new Date().toISOString(),
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 19,
        customer_name: 'Marcus Thompson',
        customer_email: 'marcus.t@email.com',
        customer_phone: '555-0119',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '17:30:00',
        party_size: 3,
        status: 'approved' as const,
        special_requests: 'Window seat preferred',
        approved_by: 'Restaurant Staff',
        approved_at: new Date().toISOString(),
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 20,
        customer_name: 'Olivia Parker',
        customer_email: 'olivia.p@email.com',
        customer_phone: '555-0120',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '18:30:00',
        party_size: 5,
        status: 'pending' as const,
        special_requests: null,
        approved_by: null,
        approved_at: null,
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 21,
        customer_name: 'Ethan Mitchell',
        customer_email: 'ethan.m@email.com',
        customer_phone: '555-0121',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '19:00:00',
        party_size: 2,
        status: 'approved' as const,
        special_requests: 'Quiet table',
        approved_by: 'Restaurant Staff',
        approved_at: new Date().toISOString(),
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 22,
        customer_name: 'Isabella Foster',
        customer_email: 'isabella.f@email.com',
        customer_phone: '555-0122',
        reservation_date: nov14.toISOString().split('T')[0],
        reservation_time: '21:00:00',
        party_size: 4,
        status: 'approved' as const,
        special_requests: 'Late dinner',
        approved_by: 'Restaurant Staff',
        approved_at: new Date().toISOString(),
        client_id: null,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    dummyReservations.push(...nov14Reservations);
    return dummyReservations;
  };

  // Use dummy data if no reservations found
  const allReservations = (reservations && reservations.length > 0) ? reservations : generateDummyReservations();

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

