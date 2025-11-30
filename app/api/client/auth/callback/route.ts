import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserBusinesses } from '@/lib/businesses';
import { ensureProfileExists, syncProfileWithAuthUser } from '@/lib/profiles';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Client auth callback route - handles redirects for authenticated client users
 * This route is primarily for backward compatibility and edge cases.
 * Email/password login happens directly in the login components.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get('error');

  if (error) {
    const errorUrl = new URL('/client/login', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    return NextResponse.redirect(errorUrl.toString());
  }

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

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    // No session - redirect to login
    const errorUrl = new URL('/client/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'authentication_failed');
    return NextResponse.redirect(errorUrl.toString());
  }

  const user = session.user;

  try {
    // Ensure profile exists and sync with auth user
    await ensureProfileExists(user.id);
    await syncProfileWithAuthUser(user.id);

    // Get user's organizations
    const organizations = await getUserBusinesses(user.id, supabaseAdmin);

    if (organizations.length === 0) {
      // User has no organizations - redirect to login with error
      const errorUrl = new URL('/client/login', requestUrl.origin);
      errorUrl.searchParams.set('error', 'no_organizations');
      return NextResponse.redirect(errorUrl.toString());
    } else if (organizations.length === 1) {
      // Single organization - redirect directly to dashboard
      return NextResponse.redirect(new URL(`/client/${organizations[0].id}/dashboard`, requestUrl.origin));
    } else {
      // Multiple organizations - redirect to selector
      return NextResponse.redirect(new URL('/client/select-org', requestUrl.origin));
    }
  } catch (error) {
    console.error('Error in client auth callback:', error);
    const errorUrl = new URL('/client/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'processing_failed');
    return NextResponse.redirect(errorUrl.toString());
  }
}
