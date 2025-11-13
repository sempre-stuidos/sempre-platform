"use client"

import { useState, useEffect } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase, checkSupabaseConfig, getBaseUrl } from "@/lib/supabase"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState("/dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Normalize redirectTo - convert '/' to '/dashboard'
    const rawRedirect = searchParams.get('redirectTo') || '/dashboard'
    const normalizedRedirect = rawRedirect === '/' ? '/dashboard' : rawRedirect
    setRedirectTo(normalizedRedirect)

    // Check for error messages from OAuth callback
    const error = searchParams.get('error')
    if (error) {
      toast.error(decodeURIComponent(error))
      // Clean up the URL by removing the error param
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl.toString())
    }

    // Check if user is already authenticated (but don't redirect - let middleware handle it)
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsAuthenticated(true)
          // Don't redirect here - middleware will handle redirecting authenticated users from /login
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth state changes - only update UI state
    // OAuth callback and middleware handle all redirects to prevent conflicts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void event;
      if (session) {
        setIsAuthenticated(true)
        // Don't redirect here - OAuth callback handles redirect after sign-in
        // Middleware handles redirect for already-authenticated users
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      checkSupabaseConfig()
      const baseUrl = getBaseUrl()
      const normalizedRedirect = redirectTo === '/' ? '/dashboard' : redirectTo
      
      // Build callback URL - Supabase will append the code parameter
      // The redirect URL must be registered in Supabase dashboard
      const callbackUrl = `${baseUrl}/auth/callback`
      
      // Store the final destination in a way that persists through OAuth flow
      // We'll use query params that Supabase will preserve
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // Pass the final destination as a query param that will be preserved
            next: normalizedRedirect
          }
        }
      })
      if (error) throw error
    } catch (error: unknown) {
      console.error('Google sign-in error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Google")
      setIsLoading(false)
    }
    // Note: Don't set loading to false here - user is being redirected
  }

  const handleGoToDashboard = () => {
    const destination = redirectTo === '/' ? '/dashboard' : (redirectTo || '/dashboard')
    // Use replace to avoid adding to history and prevent back button issues
    window.location.replace(destination)
  }

  if (checkingAuth) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center text-white/60">Checking authentication...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-white/60">
            {isAuthenticated 
              ? "You're already signed in" 
              : "Sign in with your Google account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              {isAuthenticated ? (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={handleGoToDashboard}
                  disabled={isLoading}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              )}
            </div>
            <div className="text-center text-sm">
              <span className="text-white/60">Don&apos;t have an account?{" "}</span>
              <a href="/register" className="underline underline-offset-4 text-white hover:text-white/80">
                Sign up
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-white/40 text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-white/60">Terms of Service</a>{" "}
        and <a href="#" className="underline underline-offset-4 hover:text-white/60">Privacy Policy</a>.
      </div>
    </div>
  )
}
