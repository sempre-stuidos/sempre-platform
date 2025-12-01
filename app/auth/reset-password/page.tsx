"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { HeroGeometric } from "@/components/hero-geometric"

/**
 * Client-side password reset page
 * Handles the redirect from Supabase password reset email and allows user to set new password
 */
function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const processResetToken = async () => {
      try {
        // Check for code in query string (from redirect)
        const codeFromQuery = searchParams.get('code')
        
        // Extract token from URL hash if available
        let tokenFromHash: string | null = null
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1))
            tokenFromHash = hashParams.get('access_token') || hashParams.get('code') || null
          }
        }

        // Use code from query string or hash
        const codeToProcess = codeFromQuery || tokenFromHash

        // Listen for auth state changes - Supabase might process the code automatically
        let authStateResolved = false
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || (session && session.user)) {
              if (session && session.user?.email) {
                authStateResolved = true
                setEmail(session.user.email)
                setHasSession(true)
                setIsProcessing(false)
                subscription.unsubscribe()
              }
            }
          }
        )

        // If we have a code, try to exchange it for a session
        if (codeToProcess) {
          try {
            // Try exchangeCodeForSession (available in newer Supabase versions)
            const authClient = supabase.auth as any
            if (typeof authClient.exchangeCodeForSession === 'function') {
              const { data, error } = await authClient.exchangeCodeForSession(codeToProcess)
              
              if (!error && data?.session && data?.user?.email) {
                setEmail(data.user.email)
                setHasSession(true)
                setIsProcessing(false)
                subscription.unsubscribe()
                return
              }
            }
          } catch (error) {
            console.error("Error exchanging code:", error)
          }
        }

        // Wait a bit for Supabase to process the hash token
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session && session.user?.email) {
          setEmail(session.user.email)
          setHasSession(true)
          setIsProcessing(false)
          subscription.unsubscribe()
          return
        }

        // If no session yet, wait a bit longer
        if (!authStateResolved && !session) {
          setTimeout(async () => {
            if (authStateResolved) {
              subscription.unsubscribe()
              return
            }
            
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession && retrySession.user?.email) {
              setEmail(retrySession.user.email)
              setHasSession(true)
              setIsProcessing(false)
              subscription.unsubscribe()
            } else {
              // Show error
              subscription.unsubscribe()
              toast.error("Password reset link is invalid or has expired")
              router.push("/login?error=" + encodeURIComponent("Password reset link is invalid or has expired"))
              setIsProcessing(false)
            }
          }, 2000)
        }
      } catch (error) {
        console.error("Error processing reset token:", error)
        toast.error("Something went wrong. Please try again.")
        router.push("/login?error=" + encodeURIComponent("Failed to process reset link"))
        setIsProcessing(false)
      }
    }

    processResetToken()
  }, [router, searchParams])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Update password using the reset session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      toast.success("Password reset successfully! Redirecting to login...")
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error: unknown) {
      console.error("Error resetting password:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password"
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="relative min-h-screen">
        <HeroGeometric 
          badge="Sempre Studios"
          title1="Processing"
          title2="Password Reset"
          description="Please wait while we verify your reset link."
          className="absolute inset-0"
        />
        <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <a href="#" className="flex items-center gap-3 self-center text-white">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white flex size-12 items-center justify-center rounded-md">
                <Image 
                  src="/se-logo.png" 
                  alt="Sempre Studios Logo" 
                  width={40} 
                  height={40} 
                  className="size-10"
                />
              </div>
              <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-orbitron)' }}>Sempre Studios</span>
            </a>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardContent className="pt-6">
                <div className="text-center text-white">
                  <div className="text-lg mb-2">Processing password reset...</div>
                  <div className="text-sm text-white/60">Please wait</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="relative min-h-screen">
        <HeroGeometric 
          badge="Sempre Studios"
          title1="Invalid Link"
          title2="Password Reset"
          description="The password reset link is invalid or has expired."
          className="absolute inset-0"
        />
        <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <a href="#" className="flex items-center gap-3 self-center text-white">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white flex size-12 items-center justify-center rounded-md">
                <Image 
                  src="/se-logo.png" 
                  alt="Sempre Studios Logo" 
                  width={40} 
                  height={40} 
                  className="size-10"
                />
              </div>
              <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-orbitron)' }}>Sempre Studios</span>
            </a>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-white">Invalid Reset Link</CardTitle>
                <CardDescription className="text-white/60">
                  The password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/login")}
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <HeroGeometric 
        badge="Sempre Studios"
        title1="Reset Password"
        title2="Set New Password"
        description="Enter your new password below to complete the reset process."
        className="absolute inset-0"
      />
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="#" className="flex items-center gap-3 self-center text-white">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white flex size-12 items-center justify-center rounded-md">
              <Image 
                src="/se-logo.png" 
                alt="Sempre Studios Logo" 
                width={40} 
                height={40} 
                className="size-10"
              />
            </div>
            <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-orbitron)' }}>Sempre Studios</span>
          </a>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">Reset Your Password</CardTitle>
              <CardDescription className="text-white/60">
                Enter your new password below. Make sure it's at least 6 characters long.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-white/5 border-white/20 text-white/60"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="bg-white/5 border-white/20 text-white pr-10"
                      required
                      minLength={6}
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
                  {password && validatePassword(password) && (
                    <p className="text-sm text-red-400">{validatePassword(password)}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="bg-white/5 border-white/20 text-white pr-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword &&
                    password !== confirmPassword &&
                    confirmPassword.length > 0 && (
                      <p className="text-sm text-red-400">Passwords do not match</p>
                    )}
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen">
          <HeroGeometric 
            badge="Sempre Studios"
            title1="Loading"
            title2="Please Wait"
            description="Loading password reset page..."
            className="absolute inset-0"
          />
          <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
              <div className="text-center text-white">
                <div className="text-lg mb-2">Loading...</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}
