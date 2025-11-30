import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, password } = body;

    // Validate inputs
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Update user password
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: password,
      });

    if (updateError) {
      console.error('Error updating user password:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: updatedUser.user.id,
    });
  } catch (error) {
    console.error('Error in update-password route:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}


