import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendLoginCodeEmail } from '@/lib/email'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use check-access to get user information (same as login flow)
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc('check_user_access', {
      email_input: normalizedEmail,
    })

    if (accessError) {
      console.error('Error calling check_user_access:', accessError)
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a code has been sent.'
      })
    }

    // If user not found, return success message (don't reveal user existence)
    if (!accessData || accessData.status === 'not_found' || !accessData.user_id) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a code has been sent.'
      })
    }

    const userId = accessData.user_id

    // Get user information from auth.users (same as send-code endpoint)
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !targetUser.user) {
      console.error('Error fetching user:', userError)
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a code has been sent.'
      })
    }

    const user = targetUser.user

    // Get user profile for name (same as send-code endpoint)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const userName = profile?.full_name || undefined

    // Note: We don't clear the password here because:
    // 1. Supabase Admin API doesn't support clearing passwords directly
    // 2. The code verification flow will work regardless
    // 3. When the user sets a new password after code verification, it will replace the old one
    // The code verification bypasses the password check, so the old password becomes irrelevant

    // Invalidate any existing unused codes for this user (same as send-code endpoint)
    await supabaseAdmin
      .from('login_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())

    // Generate new code
    let code: string
    let attempts = 0
    const maxAttempts = 10

    // Ensure code is unique
    do {
      code = generateLoginCode()
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
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique code. Please try again.' },
        { status: 500 }
      )
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store code in database (same as send-code endpoint)
    const { data: loginCode, error: insertError } = await supabaseAdmin
      .from('login_codes')
      .insert({
        user_id: userId,
        code,
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
        created_by: null, // System-generated for password reset (no admin user)
      })
      .select()
      .single()

    if (insertError || !loginCode) {
      console.error('Error inserting login code:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate login code' },
        { status: 500 }
      )
    }

    // Send email via Brevo
    console.log('Sending password reset code email via Brevo:', {
      to: normalizedEmail,
      code: code,
      hasApiKey: !!process.env.BREVO_API_KEY,
      fromEmail: process.env.BREVO_FROM_EMAIL || '[email protected]',
    })
    
    const emailResult = await sendLoginCodeEmail({
      email: normalizedEmail,
      code,
      name: userName,
    })

    if (!emailResult.success) {
      console.error('Failed to send email via Brevo:', emailResult.error)
      console.error('Brevo Configuration:', {
        hasApiKey: !!process.env.BREVO_API_KEY,
        fromEmail: process.env.BREVO_FROM_EMAIL,
        fromName: process.env.BREVO_FROM_NAME,
      })
      // Still return success for code generation, but log the email error
      return NextResponse.json({
        success: true,
        message: 'Code generated successfully, but email sending failed',
        error: emailResult.error,
        code: process.env.NODE_ENV === 'development' ? code : undefined, // Only return code in dev
      })
    }

    console.log('Password reset code email sent successfully via Brevo')

    // Don't reveal if user exists or not for security
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a code has been sent.'
    })
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password-send-code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send reset code' },
      { status: 500 }
    )
  }
}
