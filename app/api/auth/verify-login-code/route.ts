import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = code.toUpperCase().trim()

    // Find the code in database
    const { data: loginCode, error: codeError } = await supabaseAdmin
      .from('login_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (codeError) {
      console.error('Error querying login code:', codeError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify code' },
        { status: 500 }
      )
    }

    if (!loginCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Verify the code matches the email
    if (loginCode.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'Code does not match email' },
        { status: 400 }
      )
    }

    // Verify code hasn't expired
    const expiresAt = new Date(loginCode.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Code has expired' },
        { status: 400 }
      )
    }

    // Verify code hasn't been used
    if (loginCode.used_at) {
      return NextResponse.json(
        { success: false, error: 'Code has already been used' },
        { status: 400 }
      )
    }

    // Mark code as used
    const { error: updateError } = await supabaseAdmin
      .from('login_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', loginCode.id)

    if (updateError) {
      console.error('Error marking code as used:', updateError)
      // Don't fail the request - code is valid, just log the error
    }

    // Get user role information for password setup
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('id, role')
      .eq('user_id', loginCode.user_id)
      .maybeSingle()

    // Return user information
    return NextResponse.json({
      success: true,
      user_id: loginCode.user_id,
      email: loginCode.email,
      user_role_id: userRole?.id || null,
      role: userRole?.role || null,
    })
  } catch (error) {
    console.error('Error in POST /api/auth/verify-login-code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
