"use client"

import { useState, useEffect } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
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

export function ClientLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsAuthenticated(true)
          // Check if user has organizations and redirect accordingly
          const response = await fetch('/api/businesses')
          if (response.ok) {
            const data = await response.json()
            const organizations = data.businesses || data.organizations || []
            if (organizations.length === 1) {
              router.push(`/client/${organizations[0].id}/dashboard`)
            } else if (organizations.length > 1) {
              router.push('/client/select-org')
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      void event;
      if (session) {
        setIsAuthenticated(true)
        // Check organizations and redirect
        try {
          const response = await fetch('/api/businesses')
          if (response.ok) {
            const data = await response.json()
            const organizations = data.businesses || data.organizations || []
            if (organizations.length === 1) {
              router.push(`/client/${organizations[0].id}/dashboard`)
            } else if (organizations.length > 1) {
              router.push('/client/select-org')
            }
          }
        } catch (error) {
          console.error('Error fetching organizations:', error)
        }
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      checkSupabaseConfig()
      const baseUrl = getBaseUrl()
      
      // Build callback URL for client auth
      const callbackUrl = `${baseUrl}/api/client/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        }
      })
      if (error) {
        // Check if it's a provider not enabled error
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          toast.error("Google sign-in is not configured. Please use email/password authentication.")
        } else {
          throw error
        }
        setIsLoading(false)
        return
      }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google"
      if (errorMessage.includes('provider is not enabled') || errorMessage.includes('Unsupported provider')) {
        toast.error("Google sign-in is not configured. Please use email/password authentication.")
      } else {
        toast.error(errorMessage)
      }
      setIsLoading(false)
    }
    // Note: Don't set loading to false here - user is being redirected
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
          <CardTitle className="text-xl text-white">Welcome</CardTitle>
          <CardDescription className="text-white/60">
            {isAuthenticated 
              ? "You're already signed in" 
              : "Sign in with your Google account to access your organization"}
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
                  onClick={() => router.push('/client/select-org')}
                  disabled={isLoading}
                >
                  Continue to Dashboard
                </Button>
              ) : (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

