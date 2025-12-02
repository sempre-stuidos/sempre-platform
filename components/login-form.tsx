"use client"

import { useState, useEffect } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase, getBaseUrl } from "@/lib/supabase"
import { toast } from "sonner"
import { PasswordSetupForm } from "./password-setup-form"
import { Eye, EyeOff } from "lucide-react"

type AccessCheckResult = {
  status: "has_password" | "needs_password" | "not_found"
  role: "Admin" | "Client" | null
  businesses: Array<{ id: string; name: string; slug: string }>
  user_id: string | null
  user_role_id: number | null
}

type LoginStep = "email" | "password" | "password_setup" | "post_auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState("/dashboard")
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Email/password flow state
  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [accessCheckResult, setAccessCheckResult] = useState<AccessCheckResult | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Check for code parameter FIRST (from password reset link) - handle this before anything else
    const codeParam = searchParams.get('code')
    const redirectToParam = searchParams.get('redirectTo')
    const isResetPasswordRedirect = redirectToParam === '/auth/reset-password' || redirectToParam?.includes('reset-password')
    
    // If we have a code and it should go to reset-password, redirect there immediately
    if (codeParam && isResetPasswordRedirect) {
      // Set states to show redirecting state
      setCheckingAuth(false)
      setIsRedirecting(true)
      // Redirect to the reset-password page which will handle the code
      router.replace(`/auth/reset-password?code=${codeParam}`)
      return
    }

    // Normalize redirectTo - convert '/' to '/dashboard'
    const rawRedirect = searchParams.get('redirectTo') || '/dashboard'
    const normalizedRedirect = rawRedirect === '/' ? '/dashboard' : rawRedirect
    setRedirectTo(normalizedRedirect)

    // Check for error messages
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    if (error) {
      const errorMsg = decodeURIComponent(error)
      const descMsg = errorDescription ? decodeURIComponent(errorDescription) : ''
      
      // If it's an access_denied error, show helpful message about using code
      if (errorMsg.includes('access_denied') || descMsg.includes('invalid') || descMsg.includes('expired')) {
        toast.error(descMsg || errorMsg, {
          description: "You can use the verification code from your email instead. If you're on the password reset page, enter the code in the code field.",
          duration: 8000,
        })
      } else {
        toast.error(errorMsg)
      }
      
      // Clean up the URL by removing the error params
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      newUrl.searchParams.delete('error_description')
      newUrl.searchParams.delete('error_code')
      window.history.replaceState({}, '', newUrl.toString())
    }
    
    // Check for reset callback in URL
    const resetParam = searchParams.get('reset')
    const useCodeParam = searchParams.get('useCode')
    const emailParam = searchParams.get('email')
    
    // Handle code parameter from password reset link (if not redirected above)
    // Redirect all reset codes to the reset password page
    if (codeParam && !isResetPasswordRedirect) {
      // Redirect to reset password page to handle the code
      router.replace(`/auth/reset-password?code=${codeParam}`)
      return
    } else if (resetParam === 'true') {
      // User came back from reset email - check if we have a session
      // Supabase will have processed the token from the hash
      const checkResetSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user?.email) {
            // User has a valid reset session, set their email and show password setup
            const userEmail = session.user.email.toLowerCase().trim()
            setEmail(userEmail)
            
            // Fetch access info to get user_id and user_role_id for password setup
            const response = await fetch("/api/auth/check-access", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: userEmail }),
            })
            
            const result: AccessCheckResult = await response.json()
            setAccessCheckResult(result)
            setStep("password_setup")
          } else {
            // No session - redirect to request a new reset link
            toast.error("Password reset session expired. Please request a new password reset.")
            router.push("/login")
          }
        } catch (error) {
          console.error("Error checking reset session:", error)
        }
      }
      checkResetSession()
    }

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Fetch role and businesses to show appropriate buttons
          await handlePostAuth(session.user.email || "")
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          await handlePostAuth(session.user.email || "")
        } else {
          setStep("email")
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handlePostAuth = async (userEmail: string) => {
    try {
      // Re-check access to get role and businesses
      const response = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })

      const result: AccessCheckResult = await response.json()
      setAccessCheckResult(result)
      setStep("post_auth")
    } catch (error) {
      console.error("Error fetching access info:", error)
      toast.error("Failed to load your account information")
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const result: AccessCheckResult = await response.json()
      setAccessCheckResult(result)

      if (result.status === "not_found") {
        toast.error("We couldn&apos;t find you in the system. Please contact Sempre Studios admin.")
        setIsLoading(false)
        return
      }

      if (result.status === "needs_password") {
        setStep("password_setup")
      } else if (result.status === "has_password") {
        setStep("password")
      }
    } catch (error) {
      console.error("Error checking access:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      toast.error("Please enter your password")
      return
    }

    setIsLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("Incorrect password. Please try again.")
        } else {
          toast.error(signInError.message)
        }
        setIsLoading(false)
        return
      }

      // Success - handlePostAuth will be called by auth state change listener
      toast.success("Signed in successfully!")
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handlePasswordSet = async () => {
    // Password was set and user is signed in - fetch access info
    const userEmail = email.toLowerCase().trim()
    await handlePostAuth(userEmail)
  }

  const handleGoToDashboard = (businessId?: string) => {
    if (accessCheckResult?.role === "Admin") {
      router.push("/dashboard")
    } else if (accessCheckResult?.role === "Client" && businessId) {
      router.push(`/client/${businessId}/dashboard`)
    } else {
      router.push(redirectTo)
    }
  }

  const handleBack = () => {
    setStep("email")
    setPassword("")
    setAccessCheckResult(null)
    setResetEmailSent(false)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first")
      return
    }

    setIsResettingPassword(true)
    try {
      const baseUrl = getBaseUrl()
      const redirectUrl = `${baseUrl}/auth/reset-password`
      
      // Log the redirect URL for debugging
      console.log('Attempting password reset with redirect URL:', redirectUrl)
      console.log('Base URL:', baseUrl)
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: redirectUrl,
        }
      )

      if (resetError) {
        console.error("Error sending reset email:", resetError)
        
        // Check for specific error types
        if (resetError.message?.includes('500') || resetError.message?.includes('Error sending recovery email')) {
          toast.error(
            "Password reset email failed. The redirect URL may not be configured in Supabase. Please contact support.",
            {
              duration: 8000,
              description: `URL: ${redirectUrl}`,
            }
          )
        } else if (resetError.message?.includes('rate limit') || resetError.message?.includes('too many')) {
          toast.error("Too many requests. Please wait a moment before trying again.", {
            duration: 5000,
          })
        } else {
          toast.error(resetError.message || "Failed to send reset email. Please try again.")
        }
        setIsResettingPassword(false)
        return
      }

      toast.success("Password reset email sent! Check your inbox.")
      setResetEmailSent(true)
    } catch (error) {
      console.error("Error in forgot password:", error)
      const errorMessage = error instanceof Error ? error.message : "Something went wrong"
      toast.error(errorMessage || "Something went wrong. Please try again.")
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (isRedirecting) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center text-white/60">Redirecting to password reset...</div>
          </CardContent>
        </Card>
      </div>
    )
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

  // Post-auth: Show role-based buttons
  if (step === "post_auth" && accessCheckResult) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">You&apos;re now signed in</CardTitle>
            <CardDescription className="text-white/60">
              {accessCheckResult.role === "Admin"
                ? "Access your admin dashboard"
                : accessCheckResult.role === "Client"
                ? "Select your organization dashboard"
                : "Continue to your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {accessCheckResult.role === "Admin" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => handleGoToDashboard()}
                >
                  Go to Dashboard
                </Button>
              )}

              {accessCheckResult.role === "Client" && (
                <>
                  {accessCheckResult.businesses.length === 0 && (
                    <div className="text-center text-white/60">
                      We couldn&apos;t find you in the system. Please contact Sempre Studios admin.
                    </div>
                  )}

                  {accessCheckResult.businesses.length === 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                      onClick={() => handleGoToDashboard(accessCheckResult.businesses[0].id)}
                    >
                      Go to {accessCheckResult.businesses[0].name} Dashboard
                    </Button>
                  )}

                  {accessCheckResult.businesses.length > 1 && (
                    <div className="grid gap-2">
                      {accessCheckResult.businesses.map((business) => (
                        <Button
                          key={business.id}
                          type="button"
                          variant="outline"
                          className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                          onClick={() => handleGoToDashboard(business.id)}
                        >
                          Go to {business.name} Dashboard
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Email entry step
  if (step === "email") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-white/60">
              Sign in with your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white/5 border-white/20 text-white"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Checking your account..." : "Continue"}
                </Button>
              </div>
            </form>
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

  // Password setup step
  if (step === "password_setup" && accessCheckResult) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Create Your Password</CardTitle>
            <CardDescription className="text-white/60">
              Set a password for {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSetupForm
              email={email}
              user_id={accessCheckResult.user_id}
              user_role_id={accessCheckResult.user_role_id}
              onPasswordSet={handlePasswordSet}
            />
            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4 text-white/60 hover:text-white"
              onClick={handleBack}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password entry step
  if (step === "password") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Enter your password</CardTitle>
            <CardDescription className="text-white/60">
              Sign in to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/5 border-white/20 text-white pr-10"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!resetEmailSent ? (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-white/60 hover:text-white underline text-right self-end"
                      disabled={isLoading || isResettingPassword}
                    >
                      {isResettingPassword ? "Sending..." : "Forgot Password?"}
                    </button>
                  ) : (
                    <div className="text-sm text-green-400 text-center">
                      Password reset email sent! Check your inbox.
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-white/60 hover:text-white"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Log In"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
