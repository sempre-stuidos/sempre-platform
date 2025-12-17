import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * One-time admin endpoint to reset password for johnnygs478@gmail.com
 * This should be removed after use for security
 */
export async function POST(request: NextRequest) {
  try {
    const USER_EMAIL = 'johnnygs478@gmail.com';
    const NEW_PASSWORD = 'TempPassword123!@#';

    // Find the user
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 }
      );
    }
    
    const user = usersData?.users?.find(u => 
      u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User ${USER_EMAIL} not found` },
        { status: 404 }
      );
    }
    
    // Update password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: NEW_PASSWORD,
      }
    );
    
    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      email: USER_EMAIL,
      temporaryPassword: NEW_PASSWORD,
      userId: updatedUser.user.id,
    });
  } catch (error) {
    console.error('Error in reset-password-johnny route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

