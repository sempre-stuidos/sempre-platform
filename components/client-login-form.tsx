"use client"

import { useState, useEffect } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
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

type LoginStep = "email" | "code_verification" | "password" | "password_setup" | "post_auth"

export function ClientLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Email/password flow state
  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginCode, setLoginCode] = useState("")
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [accessCheckResult, setAccessCheckResult] = useState<AccessCheckResult | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  useEffect(() => {
    // Check for reset callback in URL (from password reset email)
    const urlParams = new URLSearchParams(window.location.search)
    const resetParam = urlParams.get('reset')
    if (resetParam === 'true') {
      // User came back from reset email - check if we have a session
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
            setCheckingAuth(false)
            return
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
          setIsAuthenticated(true)
          // Fetch role and businesses to show appropriate buttons
          await handlePostAuth(session.user.email || "")
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    if (resetParam !== 'true') {
      checkAuth()
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          setIsAuthenticated(true)
          await handlePostAuth(session.user.email || "")
        } else {
          setIsAuthenticated(false)
          setStep("email")
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

      // Auto-redirect if single business
      if (result.role === "Client" && result.businesses.length === 1) {
        router.push(`/client/${result.businesses[0].id}/dashboard`)
      } else if (result.role === "Client" && result.businesses.length > 1) {
        router.push('/client/select-org')
      }
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

      // Debug logging
      console.log('Access check result:', {
        status: result.status,
        role: result.role,
        user_id: result.user_id,
        user_role_id: result.user_role_id,
      })

      if (result.status === "not_found") {
        toast.error("We couldn't find you in the system. Please contact Sempre Studios admin.")
        setIsLoading(false)
        return
      }

      if (result.status === "needs_password") {
        // For Client role, show code verification step first
        if (result.role === "Client") {
          console.log('Client needs password - showing code verification')
          setStep("code_verification")
        } else {
          console.log('Non-Client needs password - showing password setup')
          setStep("password_setup")
        }
      } else if (result.status === "has_password") {
        console.log('User has password - showing password entry')
        setStep("password")
      } else {
        console.log('Unknown status:', result.status)
        toast.error("Unable to determine account status. Please contact support.")
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
    if (businessId) {
      router.push(`/client/${businessId}/dashboard`)
    } else if (accessCheckResult?.businesses.length === 1) {
      router.push(`/client/${accessCheckResult.businesses[0].id}/dashboard`)
    } else {
      router.push('/client/select-org')
    }
  }

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginCode || loginCode.length !== 8) {
      toast.error("Please enter a valid 8-character code")
      return
    }

    setIsVerifyingCode(true)
    try {
      const response = await fetch("/api/auth/verify-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: loginCode.toUpperCase().trim(),
          email: email.toLowerCase().trim(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || "Invalid or expired code")
        setIsVerifyingCode(false)
        return
      }

      // Code verified successfully - proceed to password setup
      // This works for both first-time setup and password reset
      toast.success("Code verified! Please create your new password.")
      
      // Update access check result with verified user info
      // If we don't have accessCheckResult, create one from the verification response
      if (!accessCheckResult) {
        // Fetch full access info
        const accessResponse = await fetch("/api/auth/check-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        })
        const accessData: AccessCheckResult = await accessResponse.json()
        setAccessCheckResult(accessData)
      } else {
        // Update existing accessCheckResult with verified user_id
        setAccessCheckResult({
          ...accessCheckResult,
          user_id: data.user_id || accessCheckResult.user_id,
          user_role_id: data.user_role_id || accessCheckResult.user_role_id,
        })
      }
      
      setStep("password_setup")
    } catch (error) {
      console.error("Error verifying code:", error)
      toast.error("Failed to verify code. Please try again.")
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleBack = () => {
    if (step === "code_verification") {
      setStep("email")
      setLoginCode("")
    } else if (step === "password_setup") {
      // If coming from code verification, go back to code step
      if (accessCheckResult?.role === "Client" && accessCheckResult?.status === "needs_password") {
        setStep("code_verification")
      } else {
        setStep("email")
      }
    } else {
      setStep("email")
    }
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
      // Generate and send login code for password reset
      const response = await fetch('/api/auth/forgot-password-send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reset code')
      }

      // Show success message
      toast.success(data.message || "If an account exists with this email, a code has been sent.")
      
      // Check if user exists and needs password reset
      // Fetch access info to determine if we should show code verification
      const accessResponse = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const accessResult: AccessCheckResult = await accessResponse.json()
      
      if (accessResult.status !== "not_found") {
        // User exists - show code verification step
        setAccessCheckResult(accessResult)
        setStep("code_verification")
        setResetEmailSent(true)
      } else {
        // User doesn't exist - just show success message
        setResetEmailSent(true)
      }
    } catch (error) {
      console.error("Error in forgot password:", error)
      const errorMessage = error instanceof Error ? error.message : "Something went wrong"
      toast.error(errorMessage || "Failed to send reset code. Please try again.")
    } finally {
      setIsResettingPassword(false)
    }
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
              {accessCheckResult.role === "Client"
                ? "Select your organization dashboard"
                : "Continue to your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {accessCheckResult.role === "Client" && (
                <>
                  {accessCheckResult.businesses.length === 0 && (
                    <div className="text-center text-white/60">
                      We couldn't find you in the system. Please contact Sempre Studios admin.
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

              {accessCheckResult.role !== "Client" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => router.push('/client/select-org')}
                >
                  Continue to Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Code verification step (for Clients needing password)
  if (step === "code_verification") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Enter Your Login Code</CardTitle>
            <CardDescription className="text-white/60">
              Check your email for the 8-character code sent by your administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeVerification}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="loginCode" className="text-white">
                    Login Code
                  </Label>
                  <Input
                    id="loginCode"
                    type="text"
                    value={loginCode}
                    onChange={(e) => {
                      // Only allow alphanumeric, uppercase, max 8 characters
                      const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)
                      setLoginCode(value)
                    }}
                    placeholder="Enter 8-character code"
                    className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest font-mono"
                    maxLength={8}
                    disabled={isVerifyingCode}
                    autoFocus
                  />
                  <p className="text-xs text-white/50 text-center">
                    Enter the code you received via email. It expires in 7 days.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-white/60 hover:text-white"
                    onClick={handleBack}
                    disabled={isVerifyingCode}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                    disabled={isVerifyingCode || loginCode.length !== 8}
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </div>
            </form>
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
            <CardTitle className="text-xl text-white">Welcome</CardTitle>
            <CardDescription className="text-white/60">
              Sign in with your email address to access your organization
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
      </div>
    )
  }

  // Password setup step
  if (step === "password_setup" && accessCheckResult) {
    // Determine if this is password reset (user had password) or first-time setup
    const isPasswordReset = accessCheckResult.status === "has_password" || resetEmailSent
    
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">
              {isPasswordReset ? "Reset Your Password" : "Create Your Password"}
            </CardTitle>
            <CardDescription className="text-white/60">
              {isPasswordReset 
                ? "Enter a new password for your account"
                : `Set a password for ${email}`
              }
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
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Log In"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
