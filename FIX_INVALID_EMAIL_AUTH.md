# Fix "Username used for auth is not valid email address" Error

## Problem
Getting this error when trying to reset password:
```
Error: 501 Username used for auth is not valid email address
```

## Root Cause

This error occurs when a user account in Supabase was created with a **username** instead of an **email address** as the primary authentication method. Password reset emails can only be sent to accounts that use email addresses for authentication.

## Solution

### Option 1: Update User in Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**
4. Find the user (search for "jacacanada@gmail.com" or the user ID: `4e4ecd80-a8c1-4a86-9b61-6d2cb3a49f74`)
5. Click on the user to edit
6. Check the **Email** field:
   - If it's empty or shows a username, you need to add/update the email
   - If the email is there but marked as unconfirmed, confirm it
7. Ensure the user has a valid email address set
8. If the user was created via OAuth (Google, etc.), the email should already be there - verify it's confirmed

### Option 2: Update User via SQL (Advanced)

If you have database access, you can update the user directly:

```sql
-- Check current user data
SELECT id, email, email_confirmed_at, raw_user_meta_data 
FROM auth.users 
WHERE id = '4e4ecd80-a8c1-4a86-9b61-6d2cb3a49f74';

-- Update email if needed (use with caution)
UPDATE auth.users 
SET email = 'jacacanada@gmail.com',
    email_confirmed_at = NOW()
WHERE id = '4e4ecd80-a8c1-4a86-9b61-6d2cb3a49f74';
```

### Option 3: Re-create User Account

If the account can be recreated:

1. Delete the problematic user account
2. Have the user sign up again with their email address
3. Ensure they use email/password signup (not username-based)

## Prevention

To prevent this issue in the future:

1. **Always use email addresses** for user authentication
2. **Verify email addresses** when users sign up
3. **Don't allow username-based signups** if you need password reset functionality
4. **Check user creation code** to ensure emails are being set correctly

## Common Scenarios

### Scenario 1: User Created via OAuth
- **Issue**: OAuth users should have emails, but they might not be confirmed
- **Fix**: Confirm the email in Supabase Dashboard → Users → User → Confirm Email

### Scenario 2: User Created via API
- **Issue**: API might have created user with username instead of email
- **Fix**: Update the user record to include a valid email address

### Scenario 3: User Created via Admin Panel
- **Issue**: Admin might have created user with username
- **Fix**: Edit user in Supabase Dashboard and add/update email

## Verification

After fixing, verify the user:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user
3. Check:
   - ✅ **Email** field has a valid email address
   - ✅ **Email Confirmed** is checked (or `email_confirmed_at` is not null)
   - ✅ **Auth Method** shows "email" not "username"

## Testing

After fixing the user account:

1. Try password reset again
2. Should now work without the 501 error
3. User should receive password reset email

## Related Error Codes

- **501**: Username used for auth is not valid email address
- **500**: General error (could be redirect URL, SMTP, etc.)
- **429**: Rate limiting
- **400**: Bad request (invalid email format, etc.)
