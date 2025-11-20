import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAllClients } from '@/lib/clients';

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

    // Get all clients (with business_id included)
    const clients = await getAllClients();
    
    // Transform to include business_id
    const clientsWithOrg = clients.map(client => ({
      id: client.id,
      name: client.name,
      business_type: client.businessType,
      status: client.status,
      contact_email: client.contactEmail,
      business_id: null, // We'll need to fetch this separately
    }));

    // Fetch business_id for each client
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('id, business_id')
      .in('id', clients.map(c => c.id));

    if (!error && clientsData) {
      // Merge business_id
      clientsWithOrg.forEach(client => {
        const dbClient = clientsData.find(c => c.id === client.id);
        if (dbClient) {
          client.business_id = dbClient.business_id;
        }
      });
    }

    return NextResponse.json({ clients: clientsWithOrg });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

