"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

/**
 * Client-side password reset page
 * Handles the redirect from Supabase password reset email
 * Supabase includes the reset token in the URL hash, which can only be read client-side
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processResetToken = async () => {
      try {
        // Wait a bit for Supabase to process the hash token
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Listen for auth state changes to catch when the token is processed
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (session && session.user)) {
              // Token was processed successfully
              if (session && session.user?.email) {
                router.push("/login?reset=true")
              }
            }
          }
        )

        // Also check session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          // Check if it's an access denied error
          if (sessionError.message?.includes('access_denied') || sessionError.message?.includes('403')) {
            toast.error("Password reset link was rejected. Please make sure Supabase has been restarted with the updated config.")
            router.push("/login?error=" + encodeURIComponent("Reset link rejected. Please contact support or try requesting a new reset email."))
          } else {
            toast.error("Password reset link is invalid or has expired")
            router.push("/login?error=" + encodeURIComponent("Password reset link is invalid or has expired"))
          }
          subscription.unsubscribe()
          setIsProcessing(false)
          return
        }

        if (session && session.user?.email) {
          // User has a valid reset session - redirect to login with reset flag
          router.push("/login?reset=true")
          subscription.unsubscribe()
          setIsProcessing(false)
        } else {
          // Wait a bit more and check again (token might still be processing)
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession && retrySession.user?.email) {
              router.push("/login?reset=true")
            } else {
              toast.error("Password reset link is invalid or has expired")
              router.push("/login?error=" + encodeURIComponent("Password reset link is invalid or has expired"))
            }
            subscription.unsubscribe()
            setIsProcessing(false)
          }, 1000)
        }
      } catch (error) {
        console.error("Error processing reset token:", error)
        toast.error("Something went wrong. Please try again.")
        router.push("/login?error=" + encodeURIComponent("Failed to process reset link"))
        setIsProcessing(false)
      }
    }

    processResetToken()
  }, [router])

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
