# Authentication Flow Documentation

## Overview
The application uses Supabase for authentication with a multi-step flow that supports:
- Email/Password authentication
- Password reset/recovery
- First-time password setup
- Role-based access (Admin vs Client)
- OAuth callbacks (for future use)

---

## Main Authentication Flows

### 1. Standard Login Flow (User Has Password)

```
User → /login
  ↓
Enter Email
  ↓
POST /api/auth/check-access
  ↓
check_user_access() function checks:
  - Does user exist in auth.users?
  - Does user have encrypted_password?
  ↓
Status: "has_password"
  ↓
Show Password Input Form
  ↓
supabase.auth.signInWithPassword()
  ↓
Success → Auth State Change Listener
  ↓
handlePostAuth() → Check user role
  ↓
Redirect based on role:
  - Admin → /dashboard
  - Client → /client/{orgId}/dashboard or /client/select-org
```

### 2. First-Time Password Setup Flow (User Needs Password)

```
User → /login
  ↓
Enter Email
  ↓
POST /api/auth/check-access
  ↓
check_user_access() function checks:
  - User exists in user_roles (invited_email)
  - User does NOT exist in auth.users OR has no password
  ↓
Status: "needs_password"
  ↓
Show Password Setup Form
  ↓
PasswordSetupForm component:
  - Checks for existing session (from email link)
  - If no session → Auto-sends password reset email
  - Shows instructions to click email link
  - Optional: Manual OTP code entry
  ↓
User clicks email link OR enters OTP code
  ↓
Email link redirects to: /auth/reset-password?code=xxx&email=xxx
  ↓
/auth/reset-password page:
  - Processes code via exchangeCodeForSession() or verifyOtp()
  - Creates recovery session
  - Redirects to /login?reset=true&email=xxx
  ↓
Login form detects reset=true
  - Checks for session
  - Shows password setup form with session
  ↓
User sets password:
  - If has session → supabase.auth.updateUser({ password })
  - If has user_id → POST /api/auth/update-password
  - If only user_role_id → POST /api/auth/create-user
  ↓
Password set → Sign in automatically
  ↓
handlePostAuth() → Redirect to appropriate dashboard
```

### 3. Password Reset Flow (Forgot Password)

```
User → /login
  ↓
Enter Email → Click "Forgot Password?"
  ↓
supabase.auth.resetPasswordForEmail()
  ↓
Email sent with magic link
  ↓
User clicks link in email
  ↓
Redirects to: /auth/reset-password?code=xxx&email=xxx
  ↓
/auth/reset-password processes code
  ↓
Redirects to: /login?reset=true&email=xxx
  ↓
Login form shows password setup
  ↓
User sets new password
  ↓
Sign in → Redirect to dashboard
```

### 4. OAuth Flow (Google, etc.)

```
User → /login → Click "Sign in with Google"
  ↓
supabase.auth.signInWithOAuth({ provider: 'google' })
  ↓
Redirects to Google OAuth
  ↓
User authorizes
  ↓
Google redirects to: /auth/callback?code=xxx
  ↓
/auth/callback route:
  - Exchanges code for session
  - Checks user role
  - Redirects based on role:
    - Admin → /dashboard
    - Client → /client/{orgId}/dashboard or /client/select-org
```

---

## Key Components

### 1. Middleware (`middleware.ts`)
- **Purpose**: Protects routes server-side
- **Public Routes**: `/login`, `/register`, `/client/login`, `/auth/reset-password`
- **Behavior**:
  - Unauthenticated users → Redirect to `/login` or `/client/login`
  - Authenticated users on login page → Redirect to dashboard
  - Preserves `redirectTo` parameter for deep linking

### 2. Login Form (`components/login-form.tsx`)
- **Steps**:
  1. `email` - User enters email
  2. `password` - User enters password (if has_password)
  3. `password_setup` - User sets password (if needs_password)
  4. `post_auth` - Shows role-based dashboard buttons
- **Key Functions**:
  - `handleEmailSubmit()` - Checks user access status
  - `handlePasswordSubmit()` - Signs in with password
  - `handlePostAuth()` - Fetches role and redirects

### 3. Password Setup Form (`components/password-setup-form.tsx`)
- **Modes**:
  - **With Session**: User clicked email link → Direct password update
  - **Without Session**: Shows OTP input + auto-sends email
- **Key Functions**:
  - `sendPasswordResetEmail()` - Sends magic link email
  - `handleVerifyOtp()` - Verifies OTP code manually
  - `handleSubmit()` - Sets password via appropriate method

### 4. Reset Password Page (`app/auth/reset-password/page.tsx`)
- **Purpose**: Processes magic link codes from email
- **Methods**:
  1. `exchangeCodeForSession()` - Modern PKCE flow
  2. `verifyOtp()` - Legacy OTP verification
  3. Auto-detection via auth state listener
- **Redirects**: `/login?reset=true&email=xxx`

### 5. Check Access API (`app/api/auth/check-access/route.ts`)
- **Purpose**: Determines user status and role
- **Calls**: `check_user_access()` database function
- **Returns**:
  ```typescript
  {
    status: "has_password" | "needs_password" | "not_found",
    role: "Admin" | "Client" | null,
    businesses: Array<{ id, name, slug }>,
    user_id: string | null,
    user_role_id: number | null
  }
  ```

### 6. Database Function (`check_user_access`)
- **Checks**:
  1. Does user exist in `auth.users`?
  2. Does user have `encrypted_password`?
  3. Does user have a role in `user_roles`?
- **Returns**: User status and role information

---

## User States

### 1. Not Found
- User doesn't exist in `user_roles` table
- **Action**: Show error "We couldn't find you in the system"

### 2. Needs Password
- User exists in `user_roles` but:
  - Doesn't exist in `auth.users`, OR
  - Exists but has no `encrypted_password`
- **Action**: Show password setup form

### 3. Has Password
- User exists in both `user_roles` and `auth.users` with password
- **Action**: Show password input form

---

## Role-Based Redirects

### Admin Users
- **Redirect**: `/dashboard`
- **Access**: Full admin dashboard

### Client Users
- **Single Organization**: `/client/{orgId}/dashboard`
- **Multiple Organizations**: `/client/select-org`
- **No Organizations**: `/client/select-org` (shows error)

---

## Email Flow Details

### Password Reset Email
- **Method**: `supabase.auth.resetPasswordForEmail()`
- **Redirect URL**: `${baseUrl}/auth/reset-password?email=xxx`
- **Email Contains**: Magic link (not visible code)
- **User Action**: Click link (preferred) OR extract code from URL

### Invitation Email (Future)
- **Method**: `supabaseAdmin.auth.admin.inviteUserByEmail()`
- **Redirect URL**: `${baseUrl}/auth/callback`
- **Creates**: Pending invitation in `user_roles` table

---

## Session Management

### Session Creation
- **Password Login**: `signInWithPassword()` creates session
- **OAuth**: OAuth callback creates session
- **Password Reset**: Magic link creates recovery session
- **OTP Verification**: `verifyOtp()` creates session

### Session Storage
- **Client**: Cookies (managed by Supabase SSR)
- **Server**: Read from cookies in middleware/API routes
- **Refresh**: Automatic via Supabase client

---

## Security Features

1. **Rate Limiting**: Supabase enforces email sending limits
2. **Token Expiry**: JWT tokens expire (default 1 hour)
3. **Magic Link Security**: Codes expire after use
4. **RLS Policies**: Database-level security via Row Level Security
5. **Middleware Protection**: Server-side route protection

---

## Error Handling

### Common Errors
- **Rate Limiting**: "Please wait X seconds before requesting another code"
- **Invalid Code**: "Invalid or expired code"
- **User Not Found**: "We couldn't find you in the system"
- **Access Denied**: Usually means redirect URL not whitelisted

### Error Recovery
- Users can request new emails (with rate limiting)
- Manual OTP entry as fallback
- Clear error messages with actionable steps

---

## Configuration Requirements

### Supabase Dashboard
1. **Redirect URLs**: Must whitelist:
   - `https://yourdomain.com/auth/reset-password`
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/login`
2. **SMTP Settings**: Configure for production emails
3. **Site URL**: Set to production domain

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (optional, for server-side redirects)

---

## Flow Diagrams

### Complete Login Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Enter Email    │
└────┬────────────┘
     │
     ▼
┌─────────────────────────┐
│  Check Access Status    │
│  (has_password?)        │
└────┬────────────────────┘
     │
     ├─── YES ──► Password Input ──► Sign In ──► Dashboard
     │
     └─── NO ──► Password Setup ──► Email Link ──► Set Password ──► Sign In ──► Dashboard
```

### Password Setup Flow
```
┌─────────────────┐
│ Password Setup  │
└────┬────────────┘
     │
     ├─── Has Session? ──► Direct Password Update
     │
     └─── No Session ──► Send Email ──► Click Link ──► Create Session ──► Password Update
```

---

## Testing Checklist

- [ ] User with password can log in
- [ ] User without password sees setup form
- [ ] Password reset email sends correctly
- [ ] Magic link redirects properly
- [ ] OTP code entry works (fallback)
- [ ] Rate limiting handled gracefully
- [ ] Admin users redirect to /dashboard
- [ ] Client users redirect to client dashboard
- [ ] Multiple orgs → select-org page
- [ ] Session persists across page refreshes
- [ ] Middleware protects routes correctly
- [ ] Deep linking works (redirectTo parameter)

---

## Future Improvements

1. **Email Templates**: Customize Supabase email templates
2. **2FA**: Add two-factor authentication
3. **Session Management**: Add "Remember Me" option
4. **Account Recovery**: Additional recovery methods
5. **Social Login**: More OAuth providers
6. **Magic Link Only**: Remove password option (passwordless)





















