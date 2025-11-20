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

export interface Business {
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

export interface BusinessWithMembership extends Business {
  membership?: Membership;
  role?: 'owner' | 'admin' | 'staff' | 'client';
}

// Legacy alias for backward compatibility during migration
export type Organization = Business;
export type OrganizationWithMembership = BusinessWithMembership;

/**
 * Get all businesses in the system
 * Uses supabaseAdmin to bypass RLS and get all businesses
 */
export async function getAllBusinesses(
  supabaseClient?: SupabaseQueryClient
): Promise<Business[]> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const { data: businesses, error } = await client
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all businesses:', error);
      throw error;
    }

    return businesses || [];
  } catch (error) {
    console.error('Error in getAllBusinesses:', error);
    return [];
  }
}

// Legacy alias for backward compatibility during migration
export const getAllOrganizations = getAllBusinesses;

/**
 * Get all businesses a user belongs to
 */
export async function getUserBusinesses(
  userId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<BusinessWithMembership[]> {
  try {
    const client = supabaseClient || supabase;
    const isUsingAdmin = supabaseClient === supabaseAdmin;
    
    console.log('getUserBusinesses - User ID:', userId, 'Using Admin:', isUsingAdmin);
    
    // First get all memberships for the user
    // Use admin client to bypass RLS if provided
    const { data: memberships, error: membershipsError } = await client
      .from('memberships')
      .select('*')
      .eq('user_id', userId);

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      console.error('Memberships error details:', JSON.stringify(membershipsError, null, 2));
      throw membershipsError;
    }

    console.log('getUserBusinesses - Found memberships:', memberships?.length || 0);

    if (!memberships || memberships.length === 0) {
      console.log('No memberships found for user:', userId);
      return [];
    }

    // Get all business IDs
    const membershipRecords = memberships as MembershipRecord[];
    const orgIds = membershipRecords.map(membership => membership.org_id);
    console.log('getUserBusinesses - Business IDs:', orgIds);

    // Fetch businesses
    // Use admin client to bypass RLS if provided
    const { data: businesses, error: businessesError } = await client
      .from('businesses')
      .select('*')
      .in('id', orgIds);

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      console.error('Businesses error details:', JSON.stringify(businessesError, null, 2));
      throw businessesError;
    }

    console.log('getUserBusinesses - Found businesses:', businesses?.length || 0);

    if (!businesses) return [];
    const businessRecords = businesses as Business[];

    // Combine the data
    return businessRecords.map((business) => {
      const membership = membershipRecords.find(record => record.org_id === business.id);
      return {
        ...business,
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
    console.error('Error in getUserBusinesses:', error);
    return [];
  }
}

// Legacy alias for backward compatibility during migration
export const getUserOrganizations = getUserBusinesses;

/**
 * Get all members of an business
 */
export async function getBusinessMembers(
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
      console.log('No memberships found for business:', orgId);
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
    console.error('Error in getBusinessMembers:', error);
    return [];
  }
}

/**
 * Get user's role in a specific business
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
 * Create a new business and add creator as owner (unless creator is super admin)
 */
export async function createBusiness(
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
): Promise<{ success: boolean; business?: Business; error?: string }> {
  try {
    console.log('Creating business:', { name, type, creatorId, description, address, phone, email, website, logo_url, status });
    
    // Check if creator is super admin (has Admin role)
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', creatorId)
      .maybeSingle();
    
    const isSuperAdmin = userRole?.role === 'Admin';
    
    // Create business
    const { data: org, error: orgError } = await supabaseAdmin
      .from('businesses')
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
      console.error('Error creating business:', orgError);
      console.error('Error details:', JSON.stringify(orgError, null, 2));
      // Check if it's a table not found error
      if (orgError.message?.includes('relation') || orgError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run the migrations first.' 
        };
      }
      return { success: false, error: orgError.message || 'Failed to create business' };
    }

    if (!org) {
      console.error('Business was not created - no data returned');
      return { success: false, error: 'Business was not created' };
    }

    console.log('Business created successfully:', org.id);

    // Only add creator as owner if they are NOT a super admin
    // Super admins can create businesses without becoming members
    if (!isSuperAdmin) {
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
      // Rollback: delete business if membership creation fails
      await supabaseAdmin.from('businesses').delete().eq('id', org.id);
      
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
    } else {
      console.log('Super admin created business without membership');
    }
    
    return { success: true, business: org };
  } catch (error) {
    console.error('Error in createBusiness:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Add user to business (create membership)
 */
export async function addUserToBusiness(
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
      return { success: false, error: 'User is already a member of this business' };
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
      return { success: false, error: error?.message || 'Failed to add user to business' };
    }

    return { success: true, membership: data };
  } catch (error) {
    console.error('Error in addUserToBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate a secure temporary password
 */
function generateTemporaryPassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)] // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // symbol
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Create a business member (new user account)
 * Creates user account with temporary password, assigns Client role, and creates membership
 */
export async function createBusinessMember(
  orgId: string,
  email: string,
  name: string,
  role: 'owner' | 'admin' | 'staff'
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const lowerEmail = email.toLowerCase().trim()
    
    // Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(user => 
      user.email?.toLowerCase() === lowerEmail
    )
    
    let userId: string
    
    if (existingUser) {
      // User exists - check if already a member
      userId = existingUser.id
      
      const { data: existingMembership } = await supabaseAdmin
        .from('memberships')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single()
      
      if (existingMembership) {
        return { success: false, error: 'User is already a member of this business' }
      }
      
      // User exists but not a member - ensure profile exists
      const { ensureProfileExists } = await import('@/lib/profiles')
      await ensureProfileExists(userId)
      
      // Check if user has Client role, if not assign it
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'Client',
            invited_email: lowerEmail,
          })
        
        if (roleError) {
          console.error('Error assigning Client role:', roleError)
          return { success: false, error: 'Failed to assign Client role' }
        }
      }
    } else {
      // User doesn't exist - create new user account
      const temporaryPassword = generateTemporaryPassword()
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: lowerEmail,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: name,
        },
      })
      
      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return { success: false, error: createError?.message || 'Failed to create user account' }
      }
      
      userId = newUser.user.id
      
      // Create profile
      const { ensureProfileExists } = await import('@/lib/profiles')
      const profile = await ensureProfileExists(userId)
      
      if (profile) {
        // Update profile with name
        await supabaseAdmin
          .from('profiles')
          .update({ full_name: name })
          .eq('id', userId)
      }
      
      // Assign Client role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'Client',
          invited_email: lowerEmail,
        })
      
      if (roleError) {
        console.error('Error assigning Client role:', roleError)
        // Don't fail here - user is created, we can try to fix role later
      }
      
      // Send password reset email (forces password change on first login)
      // Use generateLink to create a recovery link, then the user can use it to set their password
      const { getBaseUrl } = await import('@/lib/supabase')
      const baseUrl = getBaseUrl()
      const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: lowerEmail,
        options: {
          redirectTo: `${baseUrl}/client/login?reset=true`,
        },
      })
      
      if (resetError) {
        console.error('Error generating password reset link:', resetError)
        // Don't fail - user is created, they can request password reset manually
      } else if (linkData?.properties?.action_link) {
        // The link is generated - Supabase should send the email automatically
        // If email sending is not configured, the link is in linkData.properties.action_link
        console.log('Password reset link generated for:', lowerEmail)
      }
    }
    
    // Create membership (for both existing and new users)
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: orgId,
        user_id: userId,
        role,
      })
    
    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return { success: false, error: membershipError.message || 'Failed to create membership' }
    }
    
    return { success: true, userId }
  } catch (error) {
    console.error('Error in createBusinessMember:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Remove user from business
 */
export async function removeUserFromBusiness(
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
    console.error('Error in removeUserFromBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update user's role in business
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
 * Get business by ID
 */
export async function getBusinessById(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Business | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      console.log('getBusinessById - Error or no data:', error, data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBusinessById:', error);
    return null;
  }
}

/**
 * Get business linked to a client
 */
export async function getBusinessByClientId(clientId: number): Promise<Business | null> {
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('business_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.business_id) {
      return null;
    }

    return await getBusinessById(client.business_id);
  } catch (error) {
    console.error('Error in getBusinessByClientId:', error);
    return null;
  }
}

/**
 * Link client to business
 */
export async function linkClientToBusiness(
  clientId: number,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ business_id: orgId })
      .eq('id', clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in linkClientToBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Unlink client from business
 */
export async function unlinkClientFromBusiness(
  clientId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ business_id: null })
      .eq('id', clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in unlinkClientFromBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update business details
 */
export async function updateBusiness(
  orgId: string,
  updates: Partial<Pick<Business, 'name' | 'description' | 'address' | 'phone' | 'email' | 'website' | 'logo_url' | 'status'>>
): Promise<{ success: boolean; business?: Business; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update business' };
    }

    return { success: true, business: data };
  } catch (error) {
    console.error('Error in updateBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete business
 */
export async function deleteBusiness(orgId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteBusiness:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// Legacy function aliases for backward compatibility during migration
// ============================================================================

export const getOrganizationMembers = getBusinessMembers;
export const getOrganizationById = getBusinessById;
export const getOrganizationByClientId = getBusinessByClientId;
export const createOrganization = createBusiness;
export const updateOrganization = updateBusiness;
export const deleteOrganization = deleteBusiness;
export const linkClientToOrganization = linkClientToBusiness;
export const unlinkClientFromOrganization = unlinkClientFromBusiness;
export const addUserToOrganization = addUserToBusiness;
export const removeUserFromOrganization = removeUserFromBusiness;

