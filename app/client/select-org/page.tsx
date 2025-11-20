"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { IconBuilding, IconArrowRight } from "@tabler/icons-react"

interface Organization {
  id: string
  name: string
  type: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other'
  description?: string
  role?: 'owner' | 'admin' | 'staff' | 'client'
}

export default function SelectOrgPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/client/login')
          return
        }

        const response = await fetch('/api/businesses')
        if (!response.ok) {
          throw new Error('Failed to fetch organizations')
        }

        const { organizations: orgs } = await response.json()
        setOrganizations(orgs)

        // If only one organization, auto-select it
        if (orgs.length === 1) {
          router.push(`/client/${orgs[0].id}/dashboard`)
        }
      } catch (error) {
        console.error('Error fetching organizations:', error)
        toast.error('Failed to load organizations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [router])

  const handleSelectOrg = (orgId: string) => {
    router.push(`/client/${orgId}/dashboard`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-white/60">Loading organizations...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-white">No Organizations</CardTitle>
            <CardDescription className="text-white/60">
              You don&apos;t have access to any organizations yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push('/client/login')}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Select Organization</h1>
          <p className="text-white/60">Choose which organization you want to access</p>
        </div>

        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => handleSelectOrg(org.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-white/10">
                      <IconBuilding className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                      {org.description && (
                        <p className="text-sm text-white/60 mt-1">{org.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                          {org.type}
                        </span>
                        {org.role && (
                          <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                            {org.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <IconArrowRight className="h-5 w-5 text-white/60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

