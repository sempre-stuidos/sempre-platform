# Authentication Setup

This application uses Supabase for authentication with Next.js middleware to protect routes.

## How It Works

### 1. Middleware Protection (Server-Side)
The `middleware.ts` file at the root level handles server-side authentication:

- **Protected Routes**: All routes except `/login` and `/register` require authentication
- **Automatic Redirect**: Unauthenticated users are automatically redirected to `/login`
- **Deep Link Support**: The original URL is preserved in the `redirectTo` parameter, so users are redirected back after login
- **Logged-in Redirect**: If a logged-in user tries to access `/login` or `/register`, they're redirected to `/dashboard`

### 2. Login Flow
When a user tries to access a protected route:

1. Middleware checks if user is authenticated
2. If not authenticated, redirects to `/login?redirectTo=/original-page`
3. User logs in
4. After successful login, user is redirected to the original page they tried to access

### 3. Components

#### Login Form (`components/login-form.tsx`)
- Supports email/password authentication
- Supports Google OAuth
- Handles `redirectTo` parameter for deep linking
- Shows success/error messages with toast notifications

#### Auth Guard (`components/auth-guard.tsx`)
- Optional client-side protection component
- Can be wrapped around any component that needs protection
- Shows loading state while checking authentication
- Middleware already protects routes, but this provides additional client-side UX

#### Current User Hook (`hooks/use-current-user.ts`)
- React hook to access current user data
- Provides user info: `{ id, name, email, avatar }`
- Includes loading state
- Listens to auth state changes automatically

## Usage Examples

### Using the Auth Guard (Optional)
```tsx
import { AuthGuard } from "@/components/auth-guard"

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Protected content here</div>
    </AuthGuard>
  )
}
```

### Getting Current User
```tsx
import { useCurrentUser } from "@/hooks/use-current-user"

export function UserProfile() {
  const { currentUser, isLoading } = useCurrentUser()
  
  if (isLoading) return <div>Loading...</div>
  if (!currentUser) return null
  
  return <div>Welcome, {currentUser.name}!</div>
}
```

### Logout
```tsx
import { supabase } from "@/lib/supabase"

async function handleLogout() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
```

## Configuration

### Environment Variables
Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Public Routes
To add more public routes that don't require authentication, edit `middleware.ts`:

```typescript
const publicRoutes = ['/login', '/register', '/about', '/contact']
```

## Security Features

✅ Server-side authentication check (middleware)
✅ Automatic session refresh
✅ Secure cookie handling with httpOnly cookies
✅ CSRF protection via Supabase SSR
✅ OAuth support (Google)
✅ Email/password authentication

## Testing Authentication

1. **Test Redirect**: Try accessing `/dashboard` without being logged in
   - You should be redirected to `/login?redirectTo=/dashboard`

2. **Test Login**: Log in with valid credentials
   - You should be redirected back to `/dashboard`

3. **Test Protected Pages**: Navigate to any page while logged in
   - All pages should work normally

4. **Test Logout**: Sign out
   - You should be redirected to `/login`
   - Trying to access any page should redirect to login

## Notes

- The middleware runs on every request, checking authentication before rendering pages
- Static assets and API routes are excluded from authentication checks
- The authentication is SSR-compatible and works with Next.js 15
- Google OAuth requires additional setup in Supabase dashboard

