import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ensureProfileExists } from '@/lib/profiles';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, user_role_id } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!user_role_id || typeof user_role_id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'user_role_id is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if auth user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // User exists - update password instead of creating
      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: password,
        });

      if (updateError) {
        console.error('Error updating user password:', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Link to user_roles if not already linked
      const { error: linkError } = await supabaseAdmin
        .from('user_roles')
        .update({ user_id: existingUser.id })
        .eq('id', user_role_id)
        .is('user_id', null);

      if (linkError) {
        console.error('Error linking user to role:', linkError);
        // Don't fail - user is created, linking can be done later
      }

      // Ensure profile exists
      await ensureProfileExists(existingUser.id);

      return NextResponse.json({
        success: true,
        user_id: existingUser.id,
      });
    }

    // Create new auth user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true, // Auto-confirm email
      });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        {
          success: false,
          error: createError?.message || 'Failed to create user account',
        },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Link to user_roles record
    const { error: linkError } = await supabaseAdmin
      .from('user_roles')
      .update({ user_id: userId })
      .eq('id', user_role_id);

    if (linkError) {
      console.error('Error linking user to role:', linkError);
      // Don't fail - user is created, we can try to fix role later
    }

    // Ensure profile exists
    await ensureProfileExists(userId);

    return NextResponse.json({
      success: true,
      user_id: userId,
    });
  } catch (error) {
    console.error('Error in create-user route:', error);
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


