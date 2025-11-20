import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureProfileExists } from '@/lib/profiles'

/**
 * API endpoint to add a user to a business by email
 * This is a helper endpoint for adding users to businesses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, businessName, role = 'admin' } = body

    if (!email || !businessName) {
      return NextResponse.json(
        { error: 'Email and business name are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      )
    }

    // Find business by name
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .ilike('name', `%${businessName}%`)

    if (businessError || !businesses || businesses.length === 0) {
      return NextResponse.json(
        { error: `Business "${businessName}" not found` },
        { status: 404 }
      )
    }

    if (businesses.length > 1) {
      return NextResponse.json(
        { 
          error: `Multiple businesses found. Please be more specific.`,
          businesses: businesses.map(b => ({ id: b.id, name: b.name }))
        },
        { status: 400 }
      )
    }

    const business = businesses[0]

    // Check if membership already exists
    const { data: existingMembership } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('org_id', business.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json(
        { 
          error: 'User is already a member of this business',
          membership: existingMembership
        },
        { status: 400 }
      )
    }

    // Ensure profile exists
    await ensureProfileExists(user.id)

    // Check if user has Client role, if not assign it
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existingRole) {
      // Assign Client role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'Client',
          invited_email: email.toLowerCase(),
        })

      if (roleError) {
        console.error('Error assigning Client role:', roleError)
        return NextResponse.json(
          { error: 'Failed to assign Client role' },
          { status: 500 }
        )
      }
    } else if (existingRole.role !== 'Client' && existingRole.role !== 'Admin') {
      // Update role to Client if it's not already Client or Admin
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'Client' })
        .eq('user_id', user.id)

      if (roleError) {
        console.error('Error updating role to Client:', roleError)
      }
    }

    // Create membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: business.id,
        user_id: user.id,
        role: role,
      })
      .select()
      .single()

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return NextResponse.json(
        { error: membershipError.message || 'Failed to create membership' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} added to business "${business.name}" as ${role}`,
      membership,
      business: {
        id: business.id,
        name: business.name,
      },
    })
  } catch (error) {
    console.error('Error in add-user-to-business:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

