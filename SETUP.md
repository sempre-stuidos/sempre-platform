# Sempre Studios - Setup Guide

## Supabase Configuration

To enable authentication, you need to set up Supabase environment variables:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Get Your Credentials
1. Go to Project Settings > API
2. Copy your Project URL and anon public key

### 3. Set Environment Variables
Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL for OAuth redirects
# For local development: http://localhost:3000
# For production: https://your-production-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure Authentication Providers (Optional)
To enable Google OAuth:
1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials

### 5. Run the Application
```bash
npm run dev
```

## Features Implemented

✅ **Login Page** - Beautiful animated background with glass-morphism design  
✅ **Register Page** - Complete registration flow with form validation  
✅ **Supabase Integration** - Email/password and Google OAuth authentication  
✅ **Sempre Studios Branding** - Updated throughout the application  
✅ **Error Handling** - Graceful handling of missing environment variables  
✅ **Toast Notifications** - User feedback for all authentication actions  

## Pages Available

- `/login` - Sign in to your account
- `/register` - Create a new account
- `/dashboard` - Main dashboard (redirects here after login)

## Notes

- The application will show helpful error messages if Supabase is not configured
- All authentication forms include proper validation and loading states
- The design uses a dark theme with animated geometric shapes
- Forms are fully responsive and accessible


