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

### 4. Set Environment Variables

Add the following to your `.env.local` file (for local development) or your deployment platform's environment variables (for production):

```bash
# Brevo API Key (required)
BREVO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Email (optional - defaults to noreply@brevo.com)
BREVO_FROM_EMAIL=[email protected]

# Sender Name (optional - defaults to "Sempre Studios")
BREVO_FROM_NAME=Sempre Studios
```

### 5. Local Development

For local development:
- If `BREVO_API_KEY` is not set, emails will be logged to the console instead of being sent
- This allows you to develop without a Brevo account
- The code will still be generated and returned in the API response (in dev mode only)

### 6. Production

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

## Email Template

The login code email template includes:
- Welcome message with recipient name
- 8-character code prominently displayed
- Instructions for using the code
- Expiry information (7 days)
- Link to client login page
- Security notice about phishing

The template is defined in `lib/email.ts` and can be customized as needed.

## Migration from EmailJS

If you were using EmailJS before:

1. **Remove EmailJS environment variables:**
   - Remove `EMAILJS_SERVICE_ID`
   - Remove `EMAILJS_TEMPLATE_ID`
   - Remove `EMAILJS_PUBLIC_KEY`
   - Remove `EMAILJS_PRIVATE_KEY`

2. **Add Brevo environment variables:**
   - Add `BREVO_API_KEY`
   - Optionally add `BREVO_FROM_EMAIL` and `BREVO_FROM_NAME`

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
