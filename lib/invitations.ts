import { supabaseAdmin, getBaseUrl, supabase } from './supabase';

export type UserRole = 'Admin' | 'Manager' | 'Member' | 'Developer' | 'Designer' | 'Client';

/**
 * Send a team member invitation via email
 * Creates a pending invitation in user_roles table and sends email via Supabase
 */
export async function sendTeamMemberInvitation(
  email: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if user already exists by listing users with email filter
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    const existingUser = usersData?.users?.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      // User already exists, check if they already have a role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();
      
      if (existingRole) {
        return { success: false, error: 'User already has a role assigned' };
      }
      
      // User exists but no role, assign role directly
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: existingUser.id,
          role,
          invited_email: email.toLowerCase(),
        });
      
      if (roleError) {
        console.error('Error assigning role to existing user:', roleError);
        return { success: false, error: 'Failed to assign role to existing user' };
      }
      
      return { success: true };
    }

    // User doesn't exist, send invitation
    const baseUrl = getBaseUrl();
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/auth/callback`,
      data: {
        role, // Store role in user metadata
      },
    });

    if (error) {
      console.error('Error sending invitation:', error);
      return { success: false, error: error.message };
    }

    // Store pending invitation in user_roles table (without user_id)
    // This allows us to link the role when the user accepts
    const lowerEmail = email.toLowerCase();
    
    // Check if an invitation already exists for this email
    const { data: existingInvitation, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id')
      .eq('invited_email', lowerEmail)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

    // Check if there's an accepted invitation (user already has a role)
    if (existingInvitation && existingInvitation.user_id !== null) {
      return { success: false, error: 'User already has a role assigned' };
    }

    let roleError;
    if (existingInvitation && existingInvitation.user_id === null) {
      // Update existing pending invitation with new role
      const { error } = await supabaseAdmin
        .from('user_roles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', existingInvitation.id);
      roleError = error;
    } else {
      // No existing invitation, create new pending invitation
      // Note: user_id is NULL for pending invitations, will be set when user accepts
      const { error, data } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: null, // Will be populated when user accepts
          role,
          invited_email: lowerEmail,
        })
        .select();
      
      if (error) {
        console.error('Error inserting user role:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('Successfully created user_roles record:', data);
      }
      
      roleError = error;
    }

    if (roleError) {
      console.error('Error storing pending invitation:', roleError);
      console.error('Full error details:', JSON.stringify(roleError, null, 2));
      return { 
        success: false, 
        error: `Invitation sent but failed to store role mapping: ${roleError.message || roleError.code || 'Unknown error'}` 
      };
    }

    // Role mapping stored successfully in user_roles table
    // When user accepts invitation, linkUserToRole will update user_id
    return { success: true };
  } catch (error) {
    console.error('Error in sendTeamMemberInvitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
}

/**
 * Link user to their assigned role after they accept invitation
 * Called from OAuth callback after user signs in
 * Uses supabaseAdmin for server-side operations
 */
export async function linkUserToRole(
  userId: string,
  email: string
): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  try {
    // Use supabaseAdmin for server-side operations (bypasses RLS)
    // Find pending invitation by email
    const { data: pendingRole, error: findError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('invited_email', email.toLowerCase())
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !pendingRole) {
      // No pending invitation found - this is okay, user might be signing in without invitation
      return { success: false, error: 'No pending invitation found for this email' };
    }

    // Update the user_roles record with the user_id
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ user_id: userId })
      .eq('id', pendingRole.id);

    if (updateError) {
      console.error('Error linking user to role:', updateError);
      return { success: false, error: 'Failed to link user to role' };
    }

    return { success: true, role: pendingRole.role as UserRole };
  } catch (error) {
    console.error('Error in linkUserToRole:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link user to role',
    };
  }
}

/**
 * Get user's role by user ID
 * Can accept an optional Supabase client for server-side calls
 */
export async function getUserRole(
  userId: string,
  supabaseClient?: any
): Promise<UserRole | null> {
  try {
    // Use provided client, or supabaseAdmin for server-side, or supabase for client-side
    const client = supabaseClient || (typeof window === 'undefined' ? supabaseAdmin : supabase);
    
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as UserRole;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Get pending role for an invited email (before user accepts)
 */
export async function getRoleByEmail(email: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('invited_email', email.toLowerCase())
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as UserRole;
  } catch (error) {
    console.error('Error in getRoleByEmail:', error);
    return null;
  }
}

