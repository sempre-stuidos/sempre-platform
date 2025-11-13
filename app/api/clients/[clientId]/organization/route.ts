import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  linkClientToOrganization,
  unlinkClientFromOrganization,
  getOrganizationByClientId,
} from '@/lib/organizations';

interface RouteParams {
  params: Promise<{
    clientId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
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

    const orgId = parseInt(clientId);
    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const organization = await getOrganizationByClientId(orgId);

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error in GET /api/clients/[clientId]/organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
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
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(clientId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const result = await linkClientToOrganization(id, orgId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to link client to organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/clients/[clientId]/organization:', error);
    return NextResponse.json(
      { error: 'Failed to link client to organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
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

    const id = parseInt(clientId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const result = await unlinkClientFromOrganization(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to unlink client from organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clients/[clientId]/organization:', error);
    return NextResponse.json(
      { error: 'Failed to unlink client from organization' },
      { status: 500 }
    );
  }
}

