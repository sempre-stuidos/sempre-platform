"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Business } from "@/lib/businesses"

interface BusinessContext {
  business: Business | null
  role: 'owner' | 'admin' | 'staff' | 'client' | null
  isLoading: boolean
  error: string | null
}

export function useBusinessContext(): BusinessContext {
  const params = useParams()
  const orgId = params.orgId as string
  const [business, setBusiness] = useState<Business | null>(null)
  const [role, setRole] = useState<'owner' | 'admin' | 'staff' | 'client' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) {
      setError('No business ID provided')
      setIsLoading(false)
      return
    }

    const fetchBusiness = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Not authenticated')
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/businesses/${orgId}`)
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('Access denied')
          } else if (response.status === 404) {
            setError('Business not found')
          } else {
            setError('Failed to load business')
          }
          setIsLoading(false)
          return
        }

        const { business: org, role: userRole } = await response.json()
        setBusiness(org)
        setRole(userRole)
        setError(null)
      } catch (err) {
        console.error('Error fetching business:', err)
        setError('Failed to load business')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [orgId])

  return { business, role, isLoading, error }
}

