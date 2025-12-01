"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

/**
 * Client-side password reset page
 * Handles the redirect from Supabase password reset email
 * Supabase includes the reset token in the URL hash or query string, which can only be read client-side
 */
function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processResetToken = async () => {
      try {
        // Check for code in query string (from redirect)
        const codeFromQuery = searchParams.get('code')
        
        // Extract token and email from URL hash if available (Supabase often puts it here)
        let tokenFromHash: string | null = null
        let emailFromHash: string | null = null
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1))
            tokenFromHash = hashParams.get('access_token') || hashParams.get('code') || null
            emailFromHash = hashParams.get('email') || (hashParams.get('type') === 'recovery' ? hashParams.get('email') : null)
          }
        }

        // Use code from query string or hash
        const codeToProcess = codeFromQuery || tokenFromHash

        // If we have a code, try to exchange it for a session
        if (codeToProcess) {
          console.log("Processing reset code:", codeToProcess.substring(0, 20) + "...")
          
          try {
            // The code is a PKCE code that needs to be exchanged for a session
            // Try exchangeCodeForSession (available in newer Supabase versions)
            // Use type assertion to avoid TypeScript errors if method doesn't exist in types
            const authClient = supabase.auth as any
            if (typeof authClient.exchangeCodeForSession === 'function') {
              console.log("Trying exchangeCodeForSession...")
              const { data, error } = await authClient.exchangeCodeForSession(codeToProcess)
              
              if (error) {
                console.error("exchangeCodeForSession error:", error)
              } else if (data?.session && data?.user?.email) {
                console.log("Code exchanged successfully")
                // Code exchanged successfully - redirect to login with reset flag
                router.push("/login?reset=true")
                setIsProcessing(false)
                return
              }
            }
            
            // Fallback: Try verifying as OTP token (for older flows)
            console.log("Trying verifyOtp...")
            const { data, error } = await supabase.auth.verifyOtp({
              token: codeToProcess,
              type: 'recovery'
            })

            if (error) {
              console.error("verifyOtp error:", error)
            } else if (data.session && data.user?.email) {
              console.log("Code verified successfully")
              // Code verified successfully - redirect to login with reset flag
              router.push("/login?reset=true")
              setIsProcessing(false)
              return
            }
            
            // If both methods fail, wait for Supabase to process it automatically
            // Supabase might process the code from the URL automatically
            console.log("Waiting for Supabase to auto-process code...")
            await new Promise(resolve => setTimeout(resolve, 2000))
            const { data: { session } } = await supabase.auth.getSession()
            if (session && session.user?.email) {
              console.log("Session found after waiting")
              router.push("/login?reset=true")
              setIsProcessing(false)
              return
            }
          } catch (verifyError) {
            console.error("Error processing code:", verifyError)
            // Wait and check session anyway - Supabase might have processed it automatically
            await new Promise(resolve => setTimeout(resolve, 2000))
            const { data: { session } } = await supabase.auth.getSession()
            if (session && session.user?.email) {
              console.log("Session found after error")
              router.push("/login?reset=true")
              setIsProcessing(false)
              return
            }
          }
        }

        // Listen for auth state changes FIRST - Supabase might process the code automatically
        let authStateResolved = false
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            console.log("Auth state change:", event, session?.user?.email)
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || (session && session.user)) {
              // Token was processed successfully
              if (session && session.user?.email) {
                console.log("Auth event detected with session, redirecting...")
                authStateResolved = true
                subscription.unsubscribe()
                router.push("/login?reset=true")
                setIsProcessing(false)
              }
            }
          }
        )
        
        // Wait a bit for Supabase to process the hash token (if no code was found in query/hash)
        if (!codeToProcess) {
          console.log("No code found, waiting for hash token processing...")
          await new Promise(resolve => setTimeout(resolve, 1500))
        } else {
          // Even if we have a code, wait a bit for Supabase to potentially process it automatically
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Also check session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session && session.user?.email) {
          console.log("Session found immediately, redirecting...")
          // User has a valid reset session - redirect to login with reset flag
          subscription.unsubscribe()
          router.push("/login?reset=true")
          setIsProcessing(false)
          return
        }

        // If no session yet, wait longer for Supabase to process the code
        // Don't show errors immediately - give Supabase time to process
        if (!authStateResolved && !session) {
          console.log("No session yet, waiting longer for Supabase to process...")
          setTimeout(async () => {
            if (authStateResolved) {
              subscription.unsubscribe()
              return
            }
            
            const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
            if (retrySession && retrySession.user?.email) {
              console.log("Session found on retry, redirecting...")
              subscription.unsubscribe()
              router.push("/login?reset=true")
              setIsProcessing(false)
            } else {
              console.log("Still no session after waiting")
              console.error("Retry error:", retryError)
              
              // Only show error if we have a real error (not just "no session")
              if (retryError && (retryError.message?.includes('access_denied') || retryError.message?.includes('403'))) {
                const email = emailFromHash || retrySession?.user?.email || null
                if (email) {
                  subscription.unsubscribe()
                  router.push(`/login?reset=true&email=${encodeURIComponent(email)}&useCode=true`)
                  setIsProcessing(false)
                  return
                }
              }
              
              // If we have an email from hash, redirect with code entry option
              if (emailFromHash) {
                subscription.unsubscribe()
                router.push(`/login?reset=true&email=${encodeURIComponent(emailFromHash)}&useCode=true`)
                setIsProcessing(false)
              } else {
                // Last resort: show error
                subscription.unsubscribe()
                toast.error("Password reset link is invalid or has expired. You can use the verification code from your email instead.")
                router.push("/login?error=" + encodeURIComponent("Password reset link is invalid or has expired. Please use the verification code from your email."))
            setIsProcessing(false)
              }
            }
          }, 3000) // Wait 3 seconds total before showing error
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

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <div className="text-lg mb-2">Processing password reset...</div>
          <div className="text-sm text-white/60">Please wait</div>
        </div>
      </div>
    )
  }

  return null
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center text-white">
            <div className="text-lg mb-2">Loading...</div>
          </div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}
