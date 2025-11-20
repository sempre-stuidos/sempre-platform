import { supabase, supabaseAdmin } from './supabase';
import type { Profile } from './profiles';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

type MembershipRecord = {
  id: number;
  org_id: string;
  user_id: string;
  role: Membership['role'];
  created_at: string;
  updated_at: string;
};

export interface Organization {
  id: string;
  name: string;
  type: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other';
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  slug?: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: number;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff' | 'client';
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithMembership extends Organization {
  membership?: Membership;
  role?: 'owner' | 'admin' | 'staff' | 'client';
}

/**
 * Get all organizations in the system
 * Uses supabaseAdmin to bypass RLS and get all organizations
 */
export async function getAllOrganizations(
  supabaseClient?: SupabaseQueryClient
): Promise<Organization[]> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const { data: organizations, error } = await client
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all organizations:', error);
      throw error;
    }

    return organizations || [];
  } catch (error) {
    console.error('Error in getAllOrganizations:', error);
    return [];
  }
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(
  userId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<OrganizationWithMembership[]> {
  try {
    const client = supabaseClient || supabase;
    
    // First get all memberships for the user
    const { data: memberships, error: membershipsError } = await client
      .from('memberships')
      .select('*')
      .eq('user_id', userId);

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      throw membershipsError;
    }

    if (!memberships || memberships.length === 0) {
      console.log('No memberships found for user:', userId);
      return [];
    }

    // Get all organization IDs
    const membershipRecords = memberships as MembershipRecord[];
    const orgIds = membershipRecords.map(membership => membership.org_id);

    // Fetch organizations
    const { data: organizations, error: orgsError } = await client
      .from('organizations')
      .select('*')
      .in('id', orgIds);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      throw orgsError;
    }

    if (!organizations) return [];
    const organizationRecords = organizations as Organization[];

    // Combine the data
    return organizationRecords.map((org) => {
      const membership = membershipRecords.find(record => record.org_id === org.id);
      return {
        ...org,
        role: membership?.role as 'owner' | 'admin' | 'staff' | 'client' | undefined,
        membership: membership ? {
          id: membership.id,
          org_id: membership.org_id,
          user_id: membership.user_id,
          role: membership.role,
          created_at: membership.created_at,
          updated_at: membership.updated_at,
        } : undefined,
      };
    });
  } catch (error) {
    console.error('Error in getUserOrganizations:', error);
    return [];
  }
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Array<Membership & { profile?: Profile; email?: string }>> {
  try {
    const client = supabaseClient || supabase;
    // Check if we're using admin client (by comparing to supabaseAdmin)
    const isUsingAdmin = supabaseClient === supabaseAdmin;
    
    // Get memberships
    const { data: memberships, error: membershipsError } = await client
      .from('memberships')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      throw membershipsError;
    }

    if (!memberships || memberships.length === 0) {
      console.log('No memberships found for organization:', orgId);
      return [];
    }

    console.log('Found memberships:', memberships.length, 'for org:', orgId);

    // Get user IDs
    const membershipRecords = memberships as MembershipRecord[];
    const userIds = membershipRecords.map(record => record.user_id);

    // Fetch profiles - use supabaseAdmin if we're using admin client (to bypass RLS)
    const profileClient = isUsingAdmin ? supabaseAdmin : client;
    const { data: profilesData, error: profilesError } = await profileClient
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError);
      // Continue without profiles if they don't exist
    }

    // Fetch user emails from auth (if using admin client)
    const userEmails: Record<string, string> = {};
    if (isUsingAdmin) {
      // Try to get emails from auth using admin client
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        if (usersData?.users) {
          usersData.users.forEach(user => {
            if (user.email && userIds.includes(user.id)) {
              userEmails[user.id] = user.email;
            }
          });
        }
      } catch (error) {
        console.warn('Error fetching user emails:', error);
      }
    }

    // Combine the data
    const profileList = Array.isArray(profilesData) ? (profilesData as Profile[]) : [];

    return membershipRecords.map((membership) => {
      const profile = profileList.find((p) => p.id === membership.user_id);
      return {
        ...membership,
        profile: profile || undefined,
        email: userEmails[membership.user_id] || undefined,
      };
    });
  } catch (error) {
    console.error('Error in getOrganizationMembers:', error);
    return [];
  }
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRoleInOrg(
  userId: string, 
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<'owner' | 'admin' | 'staff' | 'client' | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      console.log('getUserRoleInOrg - Error or no data:', error, data);
      return null;
    }

    return data.role as 'owner' | 'admin' | 'staff' | 'client';
  } catch (error) {
    console.error('Error in getUserRoleInOrg:', error);
    return null;
  }
}

/**
 * Create a new organization and add creator as owner
 */
export async function createOrganization(
  name: string,
  type: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other',
  creatorId: string,
  description?: string,
  address?: string,
  phone?: string,
  email?: string,
  website?: string,
  logo_url?: string,
  status?: 'active' | 'inactive' | 'suspended'
): Promise<{ success: boolean; organization?: Organization; error?: string }> {
  try {
    console.log('Creating organization:', { name, type, creatorId, description, address, phone, email, website, logo_url, status });
    
    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        type,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logo_url: logo_url || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      console.error('Error details:', JSON.stringify(orgError, null, 2));
      // Check if it's a table not found error
      if (orgError.message?.includes('relation') || orgError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run the migrations first.' 
        };
      }
      return { success: false, error: orgError.message || 'Failed to create organization' };
    }

    if (!org) {
      console.error('Organization was not created - no data returned');
      return { success: false, error: 'Organization was not created' };
    }

    console.log('Organization created successfully:', org.id);

    // Add creator as owner
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: org.id,
        user_id: creatorId,
        role: 'owner',
      });

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      console.error('Membership error details:', JSON.stringify(membershipError, null, 2));
      // Rollback: delete organization if membership creation fails
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      
      // Check if it's a table not found error
      if (membershipError.message?.includes('relation') || membershipError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run the migrations first.' 
        };
      }
      
      return { success: false, error: membershipError.message || 'Failed to create membership' };
    }

    console.log('Membership created successfully for user:', creatorId);
    return { success: true, organization: org };
  } catch (error) {
    console.error('Error in createOrganization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Add user to organization (create membership)
 */
export async function addUserToOrganization(
  orgId: string,
  userId: string,
  role: 'owner' | 'admin' | 'staff' | 'client'
): Promise<{ success: boolean; membership?: Membership; error?: string }> {
  try {
    // Check if membership already exists
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'User is already a member of this organization' };
    }

    const { data, error } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: orgId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to add user to organization' };
    }

    return { success: true, membership: data };
  } catch (error) {
    console.error('Error in addUserToOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Remove user from organization
 */
export async function removeUserFromOrganization(
  orgId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('memberships')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeUserFromOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update user's role in organization
 */
export async function updateUserRoleInOrg(
  orgId: string,
  userId: string,
  role: 'owner' | 'admin' | 'staff' | 'client'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('memberships')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserRoleInOrg:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Organization | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      console.log('getOrganizationById - Error or no data:', error, data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrganizationById:', error);
    return null;
  }
}

/**
 * Get organization linked to a client
 */
export async function getOrganizationByClientId(clientId: number): Promise<Organization | null> {
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('organization_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.organization_id) {
      return null;
    }

    return await getOrganizationById(client.organization_id);
  } catch (error) {
    console.error('Error in getOrganizationByClientId:', error);
    return null;
  }
}

/**
 * Link client to organization
 */
export async function linkClientToOrganization(
  clientId: number,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ organization_id: orgId })
      .eq('id', clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in linkClientToOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Unlink client from organization
 */
export async function unlinkClientFromOrganization(
  clientId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ organization_id: null })
      .eq('id', clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in unlinkClientFromOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Pick<Organization, 'name' | 'description' | 'address' | 'phone' | 'email' | 'website' | 'logo_url' | 'status'>>
): Promise<{ success: boolean; organization?: Organization; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update organization' };
    }

    return { success: true, organization: data };
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete organization
 */
export async function deleteOrganization(orgId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

