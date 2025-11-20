"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPlus } from "@tabler/icons-react"
import { Business } from "@/lib/businesses"
import { BusinessMembers } from "@/components/business-members"
import { BusinessClients } from "@/components/business-clients"
import { BusinessSite } from "@/components/business-site"
import { BusinessSectionCards } from "@/components/business-section-cards"
import { AddMemberModal } from "@/components/add-member-modal"

interface BusinessStats {
  totalMembers: number
  membersThisMonth: number
  totalSitePages: number
  publishedPages: number
  activeMembers: number
  businessType: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other'
}

interface BusinessDetailsProps {
  orgId: string
  business: Business
  userRole: 'owner' | 'admin' | 'staff' | 'client'
  isAdmin?: boolean
  stats: BusinessStats
}

export function BusinessDetails({ orgId, business, userRole, isAdmin = false, stats }: BusinessDetailsProps) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const canManage = userRole === 'owner' || userRole === 'admin' || isAdmin

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <BusinessSectionCards stats={stats} />

      {/* Tabs */}
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="members" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="members">Staff & Members</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="site">Site</TabsTrigger>
            </TabsList>
            {canManage && (
              <Button onClick={() => setShowAddMemberModal(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
          
          <TabsContent value="members" className="mt-6">
            <BusinessMembers orgId={orgId} canManage={canManage} isAdmin={isAdmin} />
          </TabsContent>
          
          <TabsContent value="clients" className="mt-6">
            <BusinessClients orgId={orgId} canManage={canManage} />
          </TabsContent>
          
          <TabsContent value="site" className="mt-6">
            <BusinessSite orgId={orgId} canManage={canManage} />
          </TabsContent>
        </Tabs>
      </div>

      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        orgId={orgId}
        onSuccess={() => {
          setShowAddMemberModal(false)
          window.location.reload()
        }}
      />
    </div>
  )
}

