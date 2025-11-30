import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Call the RPC function
    const { data, error } = await supabaseAdmin.rpc('check_user_access', {
      email_input: normalizedEmail,
    });

    if (error) {
      console.error('Error calling check_user_access:', error);
      // Return not_found to avoid leaking information about database errors
      return NextResponse.json({
        status: 'not_found',
        role: null,
        businesses: [],
        user_id: null,
        user_role_id: null,
      });
    }

    // Return the result from the RPC function
    return NextResponse.json(data || {
      status: 'not_found',
      role: null,
      businesses: [],
      user_id: null,
      user_role_id: null,
    });
  } catch (error) {
    console.error('Error in check-access route:', error);
    // Return not_found to avoid leaking information
    return NextResponse.json({
      status: 'not_found',
      role: null,
      businesses: [],
      user_id: null,
      user_role_id: null,
    });
  }
}


