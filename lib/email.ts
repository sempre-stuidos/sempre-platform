/**
 * Email service for sending transactional emails
 * Uses Brevo (formerly Sendinblue) for email delivery
 */

import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo'

type EmailType = 'welcome' | 'password_reset'

interface SendLoginCodeEmailParams {
  email: string
  code: string
  name?: string
  emailType?: EmailType
}

/**
 * Get the base URL for email links
 */
function getBaseUrlForEmail(): string {
  // Check environment variables first (for server-side)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // Check if we're in production (Vercel)
  if (process.env.VERCEL_URL) {
    // If it's a preview deployment, use the preview URL
    if (process.env.VERCEL_ENV === 'preview') {
      return `https://${process.env.VERCEL_URL}`
    }
    // Production deployment
    return 'https://se-hub.vercel.app'
  }
  // Check NODE_ENV for production
  if (process.env.NODE_ENV === 'production') {
    return 'https://se-hub.vercel.app'
  }
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  // Fallback for client-side
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Default fallback to production
  return 'https://se-hub.vercel.app'
}

/**
 * Generate HTML email template for login code
 */
function generateLoginCodeEmailHTML(params: SendLoginCodeEmailParams): string {
  const { code, name, email } = params
  const baseUrl = getBaseUrlForEmail()
  const encodedEmail = email ? encodeURIComponent(email) : ''
  // Use 'code' parameter - login form will detect 8-character codes as our login codes (vs Supabase's longer UUIDs)
  const loginUrl = email ? `${baseUrl}/login?code=${code}&email=${encodedEmail}` : `${baseUrl}/login?code=${code}`
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>
</head>
<body style="font-family: system-ui, sans-serif, Arial; font-size: 14px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="font-family: system-ui, sans-serif, Arial; font-size: 14px">
    <a style="text-decoration: none; outline: none" href="${baseUrl}/login" target="_blank">
      <h1 style="color: #667eea; margin: 0 0 20px 0;">Sempre Studios</h1>
    </a>
    
    <p style="padding-top: 14px; border-top: 1px solid #eaeaea">
      Hello ${name || 'User'},
    </p>
    
    <p>
      To reset your password, please use the following Login Code:
    </p>
    
    <p style="font-size: 22px"><strong>${code}</strong></p>
    
    <p>This code will be valid for 7 days.</p>
    
    <p>
      <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Enter Your Code</a>
    </p>
    
    <p style="color: #666; font-size: 12px;">
      Or visit <a href="${baseUrl}/login" style="color: #667eea; text-decoration: none;">${baseUrl}/login</a> and enter the code: <strong>${code}</strong>
    </p>
    
    <p>
      Do not share this code with anyone. If you didn't make this request, you can safely ignore this email.<br />
      Sempre Studios will never contact you about this email or ask for any login codes or links. Beware of phishing scams.
    </p>
    
    <p>Thanks for visiting Sempre Studios!</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text email template for login code
 */
function generateLoginCodeEmailText(params: SendLoginCodeEmailParams): string {
  const { code, name, email } = params
  const baseUrl = getBaseUrlForEmail()
  const encodedEmail = email ? encodeURIComponent(email) : ''
  // Use 'code' parameter - login form will detect 8-character codes as our login codes (vs Supabase's longer UUIDs)
  const loginUrl = email ? `${baseUrl}/login?code=${code}&email=${encodedEmail}` : `${baseUrl}/login?code=${code}`
  
  return `
Hello ${name || 'User'},

To reset your password, please use the following Login Code:

${code}

This code will be valid for 7 days.

Visit ${loginUrl} to use this code.

Do not share this code with anyone. If you didn't make this request, you can safely ignore this email.

Sempre Studios will never contact you about this email or ask for any login codes or links. Beware of phishing scams.

Thanks for visiting Sempre Studios!
  `.trim()
}

/**
 * Get the sender email address
 */
function getSenderEmail(): string {
  return process.env.BREVO_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || '[email protected]'
}

/**
 * Get the sender name
 */
function getSenderName(): string {
  return process.env.BREVO_FROM_NAME || process.env.BREVO_SENDER_NAME || 'Sempre Studios'
}

/**
 * Get the Brevo template ID for welcome emails
 */
function getWelcomeEmailTemplateId(): number | null {
  const templateId = process.env.BREVO_WELCOME_EMAIL_TEMPLATE_ID
  if (!templateId) {
    return null
  }
  const parsedId = parseInt(templateId, 10)
  if (isNaN(parsedId)) {
    console.warn('BREVO_WELCOME_EMAIL_TEMPLATE_ID is not a valid number, falling back to hard-coded templates')
    return null
  }
  return parsedId
}

/**
 * Get the Brevo template ID for password reset emails
 */
function getPasswordResetTemplateId(): number | null {
  const templateId = process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID
  if (!templateId) {
    return null
  }
  const parsedId = parseInt(templateId, 10)
  if (isNaN(parsedId)) {
    console.warn('BREVO_PASSWORD_RESET_TEMPLATE_ID is not a valid number, falling back to hard-coded templates')
    return null
  }
  return parsedId
}

/**
 * Send login code email using Brevo
 */
export async function sendLoginCodeEmail(params: SendLoginCodeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { email, code, name, emailType = 'password_reset' } = params
    
    // Validate required parameters
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        success: false,
        error: 'Invalid email address provided'
      }
    }
    
    if (!code || typeof code !== 'string' || code.length !== 8) {
      return {
        success: false,
        error: 'Invalid code provided'
      }
    }
    
    // Get Brevo API key from environment variables
    const apiKey = process.env.BREVO_API_KEY
    
    // If Brevo is not configured, log in development mode
    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log('='.repeat(60))
        console.log('LOGIN CODE EMAIL (Development Mode - Brevo not configured)')
        console.log('='.repeat(60))
        console.log('To:', email)
        console.log('Subject: Your Sempre Studios Login Code')
        console.log('Code:', code)
        console.log('HTML Email:')
        console.log(generateLoginCodeEmailHTML(params))
        console.log('='.repeat(60))
        console.log('To enable email sending, set BREVO_API_KEY in your environment variables')
        console.log('='.repeat(60))
        return { success: true } // Return success in dev mode even without Brevo
      } else {
        return {
          success: false,
          error: 'Email service not configured. Please set BREVO_API_KEY environment variable.'
        }
      }
    }
    
    // Initialize Brevo API client
    let apiInstance: TransactionalEmailsApi
    try {
      apiInstance = new TransactionalEmailsApi()
      // Set API key using the authentications property
      ;(apiInstance as any).authentications.apiKey.apiKey = apiKey
    } catch (initError) {
      console.error('Error initializing Brevo client:', initError)
      return {
        success: false,
        error: `Failed to initialize email service: ${initError instanceof Error ? initError.message : 'Unknown error'}`
      }
    }
    
    // Get sender email and validate
    const senderEmail = getSenderEmail()
    const senderName = getSenderName()
    
    // Get the appropriate template ID based on email type
    const templateId = emailType === 'welcome' 
      ? getWelcomeEmailTemplateId() 
      : getPasswordResetTemplateId()
    
    const baseUrl = getBaseUrlForEmail()
    const encodedEmail = email ? encodeURIComponent(email) : ''
    const loginUrl = email ? `${baseUrl}/login?code=${code}&email=${encodedEmail}` : `${baseUrl}/login?code=${code}`
    
    // Determine subject based on email type
    const subject = emailType === 'welcome' 
      ? 'Welcome to SS Hub!' 
      : 'Password Reset - Sempre Studios'
    
    console.log('Email configuration:', {
      senderEmail,
      senderName,
      recipientEmail: email,
      recipientName: name,
      emailType,
      usingTemplate: !!templateId,
      templateId: templateId,
    })
    
    // Create email object
    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.subject = subject
    sendSmtpEmail.sender = {
      name: senderName,
      email: senderEmail,
    }
    sendSmtpEmail.to = [
      {
        email: email,
        name: name || 'User',
      },
    ]
    
    // Use Brevo template if template ID is configured
    if (templateId) {
      sendSmtpEmail.templateId = templateId
      
      // Set template parameters based on email type
      if (emailType === 'welcome') {
        // Welcome email template expects: setup_code, create_password_url
        sendSmtpEmail.params = {
          setup_code: code,
          create_password_url: loginUrl,
          name: name || 'User',
          baseUrl: baseUrl,
          email: email,
        }
      } else {
        // Password reset email template expects: reset_code, reset_url
        sendSmtpEmail.params = {
          reset_code: code,
          reset_url: loginUrl,
          name: name || 'User',
          baseUrl: baseUrl,
          email: email,
        }
      }
      
      console.log('Using Brevo template:', {
        templateId: templateId,
        emailType: emailType,
        params: sendSmtpEmail.params,
      })
    } else {
      // Fall back to hard-coded templates if template ID is not set
      let htmlContent: string
      let textContent: string
      try {
        htmlContent = generateLoginCodeEmailHTML(params)
        textContent = generateLoginCodeEmailText(params)
      } catch (templateError) {
        console.error('Error generating email templates:', templateError)
        return {
          success: false,
          error: `Failed to generate email template: ${templateError instanceof Error ? templateError.message : 'Unknown error'}`
        }
      }
      sendSmtpEmail.htmlContent = htmlContent
      sendSmtpEmail.textContent = textContent
      const templateEnvVar = emailType === 'welcome' 
        ? 'BREVO_WELCOME_EMAIL_TEMPLATE_ID' 
        : 'BREVO_PASSWORD_RESET_TEMPLATE_ID'
      console.log(`Using hard-coded email templates (${templateEnvVar} not set)`)
    }
    
    console.log('Sending email with Brevo:', {
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: sendSmtpEmail.subject,
      usingTemplate: !!templateId,
    })
    
    // Send email via Brevo
    try {
      console.log('Attempting to send email via Brevo:', {
        to: email,
        from: getSenderEmail(),
        fromName: getSenderName(),
        subject: sendSmtpEmail.subject,
        templateId: templateId || 'none (using hard-coded)',
      })
      
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail)
      
      console.log('Email sent via Brevo successfully:', {
        messageId: response.body?.messageId,
        statusCode: response.response?.statusCode,
        statusMessage: response.response?.statusMessage,
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Full Brevo response:', {
          messageId: response.body?.messageId,
          response: response.response,
        })
      }
      
      return { success: true }
    } catch (brevoError: any) {
      // Log detailed error information
      console.error('Brevo send error - Full details:', {
        message: brevoError?.message,
        status: brevoError?.response?.status,
        statusCode: brevoError?.response?.statusCode,
        statusText: brevoError?.response?.statusText,
        body: brevoError?.response?.body,
        text: brevoError?.response?.text,
        data: brevoError?.response?.data,
        fullError: JSON.stringify(brevoError, null, 2),
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send email'
      if (brevoError?.response?.status || brevoError?.response?.statusCode) {
        const status = brevoError.response.status || brevoError.response.statusCode
        const body = brevoError.response.body || brevoError.response.data || {}
        const bodyMessage = body.message || body.error || brevoError.message
        errorMessage = `Brevo error (status ${status}): ${bodyMessage || 'Unknown error'}`
      } else if (brevoError?.message) {
        errorMessage = `Brevo error: ${brevoError.message}`
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  } catch (error) {
    console.error('Error in sendLoginCodeEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

/**
 * Get email templates (for use in API routes that send emails via external services)
 */
export function getLoginCodeEmailTemplates(params: SendLoginCodeEmailParams) {
  return {
    subject: 'Your Sempre Studios Login Code',
    html: generateLoginCodeEmailHTML(params),
    text: generateLoginCodeEmailText(params)
  }
}
