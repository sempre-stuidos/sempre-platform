import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/invitations'
import { getUserRoleInOrg } from '@/lib/businesses'
import { sendLoginCodeEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{
    orgId: string
    userId: string
  }>
}

/**
 * Generate an 8-character alphanumeric code
 */
function generateLoginCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    let orgId: string
    let userId: string
    
    try {
      const resolvedParams = await params
      orgId = resolvedParams.orgId
      userId = resolvedParams.userId
    } catch (paramError) {
      console.error('Error resolving params:', paramError)
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error in send-code:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Admin or has permission to manage members
    let userRole: string | null = null
    let role: string | null = null
    try {
      userRole = await getUserRole(user.id, supabaseAdmin)
      const isAdmin = userRole === 'Admin'
      
      role = await getUserRoleInOrg(user.id, orgId, supabase)
      if (!isAdmin && (!role || (role !== 'owner' && role !== 'admin'))) {
        console.error('Permission denied:', { userRole, role, userId: user.id, orgId })
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch (roleError) {
      console.error('Error checking user role:', roleError)
      return NextResponse.json(
        { error: 'Failed to verify permissions' },
        { status: 500 }
      )
    }

    // Get user information
    let targetUser
    let userError
    try {
      const result = await supabaseAdmin.auth.admin.getUserById(userId)
      targetUser = result.data
      userError = result.error
    } catch (err) {
      console.error('Error fetching user:', err)
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 500 }
      )
    }
    
    if (userError || !targetUser?.user) {
      console.error('User not found:', { userError, userId })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = targetUser.user.email
    if (!userEmail) {
      console.error('User email not found:', { userId, user: targetUser.user })
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Get user profile for name
    let userName: string | undefined
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      userName = profile?.full_name || undefined
    } catch (profileError) {
      console.error('Error fetching profile (non-critical):', profileError)
      userName = undefined
    }

    // Invalidate any existing unused codes for this user
    try {
      await supabaseAdmin
        .from('login_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
    } catch (invalidateError) {
      console.error('Error invalidating existing codes (non-critical):', invalidateError)
      // Continue anyway - we'll generate a new code
    }

    // Generate new code
    let code: string
    let attempts = 0
    const maxAttempts = 10

    // Ensure code is unique
    do {
      code = generateLoginCode()
      try {
        const { data: existing } = await supabaseAdmin
          .from('login_codes')
          .select('id')
          .eq('code', code)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (!existing) {
          break
        }
      } catch (checkError) {
        console.error('Error checking code uniqueness (non-critical):', checkError)
        // Assume code is unique and break
        break
      }
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique code. Please try again.' },
        { status: 500 }
      )
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store code in database
    const { data: loginCode, error: insertError } = await supabaseAdmin
      .from('login_codes')
      .insert({
        user_id: userId,
        code,
        email: userEmail.toLowerCase().trim(),
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError || !loginCode) {
      console.error('Error inserting login code:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate login code' },
        { status: 500 }
      )
    }

    // Send email via Brevo
    let emailResult
    try {
      emailResult = await sendLoginCodeEmail({
        email: userEmail,
        code,
        name: userName,
      })
    } catch (emailError) {
      console.error('Exception while sending email:', emailError)
      console.error('Email error details:', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
        stack: emailError instanceof Error ? emailError.stack : undefined,
        userEmail,
        code,
        userName,
      })
      
      // Still return success for code generation, but log the email error
      // The code is still valid and can be manually shared if needed
      return NextResponse.json({
        success: true,
        message: 'Login code generated successfully, but email sending failed',
        error: emailError instanceof Error ? emailError.message : 'Failed to send email',
        code: process.env.NODE_ENV === 'development' ? code : undefined, // Only return code in dev
      })
    }

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)
      console.error('Brevo Configuration Check:', {
        hasApiKey: !!process.env.BREVO_API_KEY,
        hasFromEmail: !!process.env.BREVO_FROM_EMAIL,
        apiKeyPrefix: process.env.BREVO_API_KEY?.substring(0, 10) + '...',
      })
      
      // Still return success for code generation, but log the email error
      // The code is still valid and can be manually shared if needed
      return NextResponse.json({
        success: true,
        message: 'Login code generated successfully, but email sending failed',
        error: emailResult.error,
        code: process.env.NODE_ENV === 'development' ? code : undefined, // Only return code in dev
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Login code generated and sent successfully',
      code: process.env.NODE_ENV === 'development' ? code : undefined, // Only return code in dev
    })
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/members/[userId]/send-code:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to send login code'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    console.error('Error details:', errorDetails)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    // Always return JSON, even on unexpected errors
    try {
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        },
        { status: 500 }
      )
    } catch (jsonError) {
      // If even JSON serialization fails, return a plain text response
      console.error('Failed to serialize error to JSON:', jsonError)
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          error: 'Internal server error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
