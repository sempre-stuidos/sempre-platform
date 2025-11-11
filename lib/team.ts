import { supabase, supabaseAdmin } from './supabase';
import { TeamMember } from './types';

// Transform database record to match frontend interface
function transformTeamMemberRecord(record: Record<string, unknown>, skills: Record<string, unknown>[], deadlines: Record<string, unknown>[]): TeamMember {
  return {
    id: record.id as number,
    name: record.name as string | null,
    role: record.role as string,
    status: record.status as "Active" | "Contractor" | "Past Collaborator",
    email: record.email as string,
    timezone: record.timezone as string | null,
    avatar: record.avatar as string,
    currentProjects: record.current_projects as number,
    activeTasks: record.active_tasks as number,
    workload: record.workload as number,
    skills: skills.map(s => s.skill as string),
    upcomingDeadlines: deadlines.map(d => ({
      project: d.project as string,
      deadline: d.deadline as string,
      type: d.type as string
    })),
    auth_user_id: record.auth_user_id as string | null | undefined,
    invited_email: record.invited_email as string | null | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformTeamMemberToRecord(teamMember: Partial<TeamMember>) {
  return {
    name: teamMember.name,
    role: teamMember.role,
    status: teamMember.status,
    email: teamMember.email,
    timezone: teamMember.timezone,
    avatar: teamMember.avatar,
    current_projects: teamMember.currentProjects,
    active_tasks: teamMember.activeTasks,
    workload: teamMember.workload,
    auth_user_id: teamMember.auth_user_id,
    invited_email: teamMember.invited_email,
  };
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    // Fetch all users with their roles from user_roles table
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true });

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError);
      throw userRolesError;
    }

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    // Fetch user details from auth.users for each user_id
    const userIds = userRoles.map(ur => ur.user_id).filter(Boolean) as string[];
    
    // Get users from auth.users using admin client
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Filter users to only those with roles
    const usersWithRoles = (usersData?.users || []).filter(user => 
      userIds.includes(user.id)
    );

    // Create a map of user_id to user_roles record
    const roleMap = new Map(
      userRoles.map(ur => [ur.user_id, ur])
    );

    // Transform auth.users + user_roles to TeamMember format
    return usersWithRoles
      .map((user) => {
        const userRole = roleMap.get(user.id);
        if (!userRole) {
          return null; // Skip users without a role (shouldn't happen due to filtering, but safety check)
        }
        
        const metadata = user.user_metadata || {};
        const email = user.email || userRole.invited_email || '';
        const name = metadata.full_name || metadata.name || email.split('@')[0] || 'Unknown';
        const avatar = metadata.avatar_url || metadata.picture || '';

        return {
          id: userRole.id as number, // Use user_roles.id as the stable numeric ID
          name: name,
          role: userRole.role,
          status: 'Active' as const,
          email: email,
          timezone: metadata.timezone || 'UTC',
          avatar: avatar,
          currentProjects: 0,
          activeTasks: 0,
          workload: 0,
          skills: [],
          upcomingDeadlines: [],
          auth_user_id: user.id,
          invited_email: userRole.invited_email || null,
          created_at: userRole.created_at || user.created_at,
          updated_at: userRole.updated_at || user.updated_at || user.created_at,
        };
      })
      .filter((member): member is TeamMember => member !== null);
  } catch (error) {
    console.error('Error in getAllTeamMembers:', error);
    return [];
  }
}

export async function getTeamMemberById(id: number): Promise<TeamMember | null> {
  try {
    // Fetch user_role by id
    const { data: userRole, error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (userRoleError || !userRole || !userRole.user_id) {
      console.error('Error fetching user role:', userRoleError);
      return null;
    }

    // Fetch user from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
    
    if (userError || !userData?.user) {
      console.error('Error fetching user:', userError);
      return null;
    }

    const user = userData.user;
    const metadata = user.user_metadata || {};
    const email = user.email || userRole.invited_email || '';
    const name = metadata.full_name || metadata.name || email.split('@')[0] || 'Unknown';
    const avatar = metadata.avatar_url || metadata.picture || '';

    return {
      id: userRole.id as number,
      name: name,
      role: userRole.role,
      status: 'Active' as const,
      email: email,
      timezone: metadata.timezone || 'UTC',
      avatar: avatar,
      currentProjects: 0,
      activeTasks: 0,
      workload: 0,
      skills: [],
      upcomingDeadlines: [],
      auth_user_id: user.id,
      invited_email: userRole.invited_email || null,
      created_at: userRole.created_at || user.created_at,
      updated_at: userRole.updated_at || user.updated_at || user.created_at,
    };
  } catch (error) {
    console.error('Error in getTeamMemberById:', error);
    return null;
  }
}

// Note: createTeamMember is no longer needed
// Team members are created through the invitation system (user_roles table)
// Users are added to the team by creating a user_roles record via sendTeamMemberInvitation
export async function createTeamMember(teamMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember | null> {
  // This function is deprecated - use invitation system instead
  console.warn('createTeamMember is deprecated. Use sendTeamMemberInvitation from lib/invitations instead.');
  return null;
}

export async function updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember | null> {
  try {
    // Find the user_role record by id
    const { data: userRole, error: findError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !userRole || !userRole.user_id) {
      console.error('Error finding user role:', findError);
      throw findError || new Error('User role not found');
    }

    // Update role in user_roles table if provided
    if (updates.role) {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: updates.role })
        .eq('id', id);

      if (roleUpdateError) {
        console.error('Error updating role:', roleUpdateError);
        throw roleUpdateError;
      }
    }

    // Update user metadata in auth.users if name or avatar is provided
    if (updates.name || updates.avatar) {
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
      
      if (user?.user) {
        const currentMetadata = user.user.user_metadata || {};
        const updatedMetadata = {
          ...currentMetadata,
          ...(updates.name && { full_name: updates.name, name: updates.name }),
          ...(updates.avatar && { avatar_url: updates.avatar, picture: updates.avatar }),
        };

        const { error: userUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          userRole.user_id,
          { user_metadata: updatedMetadata }
        );

        if (userUpdateError) {
          console.error('Error updating user metadata:', userUpdateError);
          throw userUpdateError;
        }
      }
    }

    // Refresh and return the updated team member
    const allMembers = await getAllTeamMembers();
    return allMembers.find(member => member.id === id) || null;
  } catch (error) {
    console.error('Error in updateTeamMember:', error);
    return null;
  }
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  try {
    // Find the user_role record by id
    const { data: userRole, error: findError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !userRole) {
      console.error('Error finding user role:', findError);
      throw findError || new Error('User role not found');
    }

    // Delete the user_role record (this removes the user from the team)
    // Note: This does NOT delete the auth user, just removes their role
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user role:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTeamMember:', error);
    return false;
  }
}

export async function getTeamMembersByStatus(status: 'Active' | 'Contractor' | 'Past Collaborator'): Promise<TeamMember[]> {
  // Since user_roles doesn't have a status field, all users are considered 'Active'
  // This function now returns all team members (all are Active)
  if (status === 'Active') {
    return await getAllTeamMembers();
  }
  // For other statuses, return empty array since we don't track status anymore
  return [];
}

export async function getTeamMembersByRole(role: string): Promise<TeamMember[]> {
  try {
    // Fetch user_roles with the specified role
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('role', role)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true });

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError);
      throw userRolesError;
    }

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    // Fetch user details from auth.users
    const userIds = userRoles.map(ur => ur.user_id).filter(Boolean) as string[];
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const usersWithRoles = (usersData?.users || []).filter(user => 
      userIds.includes(user.id)
    );

    const roleMap = new Map(
      userRoles.map(ur => [ur.user_id, ur])
    );

    return usersWithRoles
      .map((user) => {
        const userRole = roleMap.get(user.id);
        if (!userRole) return null;
        
        const metadata = user.user_metadata || {};
        const email = user.email || userRole.invited_email || '';
        const name = metadata.full_name || metadata.name || email.split('@')[0] || 'Unknown';
        const avatar = metadata.avatar_url || metadata.picture || '';

        return {
          id: userRole.id as number,
          name: name,
          role: userRole.role,
          status: 'Active' as const,
          email: email,
          timezone: metadata.timezone || 'UTC',
          avatar: avatar,
          currentProjects: 0,
          activeTasks: 0,
          workload: 0,
          skills: [],
          upcomingDeadlines: [],
          auth_user_id: user.id,
          invited_email: userRole.invited_email || null,
          created_at: userRole.created_at || user.created_at,
          updated_at: userRole.updated_at || user.updated_at || user.created_at,
        };
      })
      .filter((member): member is TeamMember => member !== null);
  } catch (error) {
    console.error('Error in getTeamMembersByRole:', error);
    return [];
  }
}

/**
 * Link team member to auth user after they accept invitation
 * Updates user_roles record with user_id and updates user metadata in auth.users
 * Uses supabaseAdmin for server-side operations
 */
export async function linkTeamMemberToAuthUser(
  userId: string,
  email: string,
  name: string,
  avatar?: string
): Promise<TeamMember | null> {
  try {
    // Find the user_roles record by invited_email
    const { data: userRole, error: findError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('invited_email', email.toLowerCase())
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !userRole) {
      // Check if user already has a role assigned
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // User already has a role, just update their metadata and return
        if (name || avatar) {
          const metadata: Record<string, unknown> = {};
          if (name) {
            metadata.full_name = name;
            metadata.name = name;
          }
          if (avatar) {
            metadata.avatar_url = avatar;
            metadata.picture = avatar;
          }

          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadata
          });
        }
        return await getTeamMemberById(existingRole.id as number);
      }

      console.error('Error finding user role for invitation:', findError);
      return null;
    }

    // Update user_roles record with user_id
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ user_id: userId })
      .eq('id', userRole.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw updateError;
    }

    // Update user metadata in auth.users
    if (name || avatar) {
      const metadata: Record<string, unknown> = {};
      if (name) {
        metadata.full_name = name;
        metadata.name = name;
      }
      if (avatar) {
        metadata.avatar_url = avatar;
        metadata.picture = avatar;
      }

      const { error: userUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });

      if (userUpdateError) {
        console.error('Error updating user metadata:', userUpdateError);
        // Don't throw - role update succeeded
      }
    }

    return await getTeamMemberById(userRole.id as number);
  } catch (error) {
    console.error('Error in linkTeamMemberToAuthUser:', error);
    return null;
  }
}
