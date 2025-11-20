"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
import { HeroGeometric } from "@/components/hero-geometric"

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
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/businesses')
        if (!response.ok) {
          throw new Error('Failed to fetch businesses')
        }

        const data = await response.json()
        const orgs = data.businesses || data.organizations || []
        setOrganizations(orgs)

        // If only one business, auto-select it (but only redirect once)
        if (orgs && orgs.length === 1 && !hasRedirected) {
          setHasRedirected(true)
          router.push(`/client/${orgs[0].id}/dashboard`)
        }
      } catch (error) {
        console.error('Error fetching businesses:', error)
        toast.error('Failed to load businesses')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [router, hasRedirected])

  const handleSelectOrg = (orgId: string) => {
    router.push(`/client/${orgId}/dashboard`)
  }

  const handleBackToLogin = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect even if signout fails
      router.push('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <HeroGeometric 
          badge="Sempre Studios"
          title1="Loading"
          title2="Please Wait"
          description="Fetching your businesses..."
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
                <div className="text-center text-white/60">Loading businesses...</div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="relative min-h-screen">
        <HeroGeometric 
          badge="Sempre Studios"
          title1="No Access"
          title2="No Businesses"
          description="You don't have access to any businesses yet."
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
          <CardHeader>
                <CardTitle className="text-white">No Businesses</CardTitle>
            <CardDescription className="text-white/60">
                  You don&apos;t have access to any businesses yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={handleBackToLogin}
            >
              Back to Login
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
        title1="Select Business"
        title2="Choose Your Business"
        description="Select which business you want to access."
        className="absolute inset-0"
      />
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-2xl flex-col gap-6">
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
    </div>
  )
}

