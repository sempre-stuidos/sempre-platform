"use client"

import { useState, useEffect } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          const fullName = authUser.user_metadata?.first_name && authUser.user_metadata?.last_name 
            ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
            : authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
          
          setCurrentUser({
            id: authUser.id,
            name: fullName,
            email: authUser.email || '',
            avatar: authUser.user_metadata?.avatar_url || '',
          })
        }
      } catch (error) {
        console.log('No authenticated user or Supabase not configured', error)
      } finally {
        setIsLoading(false)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const fullName = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name 
            ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}`
            : session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          
          setCurrentUser({
            id: session.user.id,
            name: fullName,
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url || '',
          })
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { currentUser, isLoading }
}
