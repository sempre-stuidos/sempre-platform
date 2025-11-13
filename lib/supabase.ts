import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Get the base URL for redirects
// Always uses window.location.origin on client-side (most reliable)
// Uses env var on server-side for SSR
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: always use the actual origin the user is on
    // This works for both development and production automatically
    return window.location.origin
  }
  // Server-side: use env var or default to localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// Check if Supabase is properly configured
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use createBrowserClient for client-side code (works with middleware)
// This properly handles cookies for SSR authentication
// Use global window object to ensure true singleton across module reloads
declare global {
  interface Window {
    __supabaseClient?: ReturnType<typeof createBrowserClient>;
  }
}

export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: use window object for true singleton
    if (!window.__supabaseClient) {
      window.__supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return window.__supabaseClient;
  } else {
    // Server-side: create new instance per request (SSR context)
    return createClient(supabaseUrl, supabaseAnonKey);
  }
})()

// For server-side operations that require elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to check if Supabase is configured
export const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
}
