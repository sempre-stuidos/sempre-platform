# Brevo Email Setup

This project uses [Brevo](https://www.brevo.com/) (formerly Sendinblue) for sending transactional emails, including login codes for business members.

## Why Brevo?

- ✅ **Free Tier**: 300 emails/day (9,000/month) - much more than EmailJS
- ✅ **No Credit Card Required**: Free tier is truly free
- ✅ **Reliable**: Professional transactional email service
- ✅ **Easy Setup**: Simple API key authentication
- ✅ **Better Deliverability**: Industry-standard email service
- ✅ **No Domain Verification Required**: Can start immediately

## Setup Instructions

### 1. Create a Brevo Account

1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. In Brevo Dashboard, go to **Settings** → **SMTP & API**
2. Click on **API Keys** tab
3. Click **Generate a new API key**
4. Give it a name (e.g., "Sempre Studios Production")
5. Copy the API key (you'll only see it once!)
6. **Save it securely** - you'll need it for environment variables

### 3. Set Sender Email (Optional but Recommended)

1. In Brevo Dashboard, go to **Settings** → **Senders & IP**
2. Add a sender email address (the email that will send the emails)
3. Verify the email address (check your inbox for verification email)
4. This improves deliverability

### 4. Create Email Templates in Brevo (Recommended)

Using Brevo email templates allows you to manage email designs directly in the Brevo dashboard without code changes.

You need to create **two separate templates**:

#### 4a. Welcome Email Template

This template is used when an admin sends a login code to a new member.

1. In Brevo Dashboard, go to **Transactional** → **Email Templates**
2. Click **Create a new template**
3. Choose **Code Editor** or **Drag & Drop Editor**
4. Design your welcome email template
5. Use the following variables in your template:
   - `{{params.setup_code}}` - The 8-character login code
   - `{{params.create_password_url}}` - The full login URL with code and email
   - `{{params.name}}` - The recipient's name (or "User" if not provided)
   - `{{params.baseUrl}}` - The base URL of the application
   - `{{params.email}}` - The recipient's email address
6. Save the template and note the **Template ID** (you'll see it in the URL or template details)

**Example welcome email template variables:**
```
Hello {{params.name}},

Your setup code is: {{params.setup_code}}

Click here to create your password: {{params.create_password_url}}

This code is valid for 7 days.
```

#### 4b. Password Reset Email Template

This template is used when a user requests a password reset.

1. In Brevo Dashboard, go to **Transactional** → **Email Templates**
2. Click **Create a new template**
3. Choose **Code Editor** or **Drag & Drop Editor**
4. Design your password reset email template
5. Use the following variables in your template:
   - `{{params.reset_code}}` - The 8-character reset code
   - `{{params.reset_url}}` - The full login URL with code and email
   - `{{params.name}}` - The recipient's name (or "User" if not provided)
   - `{{params.baseUrl}}` - The base URL of the application
   - `{{params.email}}` - The recipient's email address
6. Save the template and note the **Template ID** (you'll see it in the URL or template details)

**Example password reset email template variables:**
```
Hello {{params.name}},

Your reset code is: {{params.reset_code}}

Click here to reset your password: {{params.reset_url}}

This code expires in 1 hour.
```

### 5. Set Environment Variables

Add the following to your `.env.local` file (for local development) or your deployment platform's environment variables (for production):

```bash
# Brevo API Key (required)
BREVO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Email (optional - defaults to noreply@brevo.com)
BREVO_FROM_EMAIL=[email protected]

# Sender Name (optional - defaults to "Sempre Studios")
BREVO_FROM_NAME=Sempre Studios

# Brevo Template ID for Welcome Emails (optional - if not set, uses hard-coded templates)
# Used when admin sends login code to new members
BREVO_WELCOME_EMAIL_TEMPLATE_ID=1

# Brevo Template ID for Password Reset Emails (optional - if not set, uses hard-coded templates)
# Used when users request password reset
BREVO_PASSWORD_RESET_TEMPLATE_ID=2
```

**Note:** If template IDs are not set, the system will fall back to hard-coded HTML templates defined in the code. This is useful for development or if you prefer to manage templates in code.

### 6. Local Development

For local development:
- If `BREVO_API_KEY` is not set, emails will be logged to the console instead of being sent
- This allows you to develop without a Brevo account
- The code will still be generated and returned in the API response (in dev mode only)
- If template IDs are not set, hard-coded templates will be used

### 7. Production

For production:
- **Always set `BREVO_API_KEY`** - emails will fail if not configured
- Set `BREVO_FROM_EMAIL` to a verified sender email for better deliverability
- Monitor your Brevo dashboard for email delivery status

## Testing

1. Set up your Brevo account and get API key
2. Add `BREVO_API_KEY` to environment variables
3. Add a business member who needs a password
4. Click "Send Code" button
5. Check the member's email inbox for the login code
6. Verify the email looks correct and contains the 8-character code

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `BREVO_API_KEY` is set correctly
2. **Check Sender Email**: Ensure sender email is verified in Brevo
3. **Check Logs**: Look at server logs for Brevo error messages
4. **Check Brevo Dashboard**: View email logs in Brevo dashboard for delivery status

### Common Errors

- **"Email service not configured"**: `BREVO_API_KEY` is missing
- **"Invalid API key"**: API key is incorrect or expired
- **"Sender email not verified"**: Verify your sender email in Brevo Dashboard
- **"Rate limit exceeded"**: Free tier is 300 emails/day - wait or upgrade

### Rate Limits

- **Free Tier**: 300 emails/day, 9,000 emails/month
- **Lite Plan**: $25/month - 10,000 emails/month
- **Premium Plans**: Higher limits available
- See [Brevo Pricing](https://www.brevo.com/pricing/) for details

## Email Templates

### Using Brevo Templates (Recommended)

When template IDs are set, the system uses Brevo email templates. This allows you to:
- Design emails visually in the Brevo dashboard
- Update email designs without code changes
- Use Brevo's template editor features
- A/B test different email designs

#### Welcome Email Template Variables

When `BREVO_WELCOME_EMAIL_TEMPLATE_ID` is set, the following variables are available:
- `{{params.setup_code}}` - The 8-character login code
- `{{params.create_password_url}}` - The full login URL with code and email (e.g., `/login?code=ABC12345&email=user@example.com`)
- `{{params.name}}` - The recipient's name (or "User" if not provided)
- `{{params.baseUrl}}` - The base URL of the application
- `{{params.email}}` - The recipient's email address

#### Password Reset Email Template Variables

When `BREVO_PASSWORD_RESET_TEMPLATE_ID` is set, the following variables are available:
- `{{params.reset_code}}` - The 8-character reset code
- `{{params.reset_url}}` - The full login URL with code and email (e.g., `/login?code=ABC12345&email=user@example.com`)
- `{{params.name}}` - The recipient's name (or "User" if not provided)
- `{{params.baseUrl}}` - The base URL of the application
- `{{params.email}}` - The recipient's email address

### Using Hard-Coded Templates (Fallback)

If template IDs are not set, the system uses hard-coded HTML templates defined in `lib/email.ts`. The templates include:
- Welcome message with recipient name
- 8-character code prominently displayed
- Instructions for using the code
- Expiry information (7 days for welcome, 1 hour for password reset)
- Link to client login page
- Security notice about phishing

You can customize the hard-coded templates by editing `lib/email.ts`.

## Migration from EmailJS

If you were using EmailJS before:

1. **Remove EmailJS environment variables:**
   - Remove `EMAILJS_SERVICE_ID`
   - Remove `EMAILJS_TEMPLATE_ID`
   - Remove `EMAILJS_PUBLIC_KEY`
   - Remove `EMAILJS_PRIVATE_KEY`

2. **Add Brevo environment variables:**
   - Add `BREVO_API_KEY`
   - Optionally add `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_WELCOME_EMAIL_TEMPLATE_ID`, and `BREVO_PASSWORD_RESET_TEMPLATE_ID`

3. **Update your deployment:**
   - Update environment variables in Vercel/your hosting platform
   - Redeploy your application

## Security Notes

- **Never commit API keys to version control**
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Monitor your Brevo dashboard for unusual activity

## Support

- [Brevo Documentation](https://developers.brevo.com/)
- [Brevo API Reference](https://developers.brevo.com/reference)
- [Brevo Support](https://help.brevo.com/)
