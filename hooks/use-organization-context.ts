"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Organization } from "@/lib/organizations"

interface OrganizationContext {
  organization: Organization | null
  role: 'owner' | 'admin' | 'staff' | 'client' | null
  isLoading: boolean
  error: string | null
}

export function useOrganizationContext(): OrganizationContext {
  const params = useParams()
  const orgId = params.orgId as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [role, setRole] = useState<'owner' | 'admin' | 'staff' | 'client' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) {
      setError('No organization ID provided')
      setIsLoading(false)
      return
    }

    const fetchOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Not authenticated')
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/organizations/${orgId}`)
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('Access denied')
          } else if (response.status === 404) {
            setError('Organization not found')
          } else {
            setError('Failed to load organization')
          }
          setIsLoading(false)
          return
        }

        const { organization: org, role: userRole } = await response.json()
        setOrganization(org)
        setRole(userRole)
        setError(null)
      } catch (err) {
        console.error('Error fetching organization:', err)
        setError('Failed to load organization')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [orgId])

  return { organization, role, isLoading, error }
}

