"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPlus } from "@tabler/icons-react"
import { Organization } from "@/lib/organizations"
import { OrganizationMembers } from "@/components/organization-members"
import { OrganizationSite } from "@/components/organization-site"
import { OrganizationSectionCards } from "@/components/organization-section-cards"
import { AddMemberModal } from "@/components/add-member-modal"

interface OrganizationStats {
  totalMembers: number
  membersThisMonth: number
  totalSitePages: number
  publishedPages: number
  activeMembers: number
  organizationType: 'agency' | 'client'
}

interface OrganizationDetailsProps {
  orgId: string
  organization: Organization
  userRole: 'owner' | 'admin' | 'staff' | 'client'
  isAdmin?: boolean
  stats: OrganizationStats
}

export function OrganizationDetails({ orgId, organization, userRole, isAdmin = false, stats }: OrganizationDetailsProps) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const canManage = userRole === 'owner' || userRole === 'admin' || isAdmin

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <OrganizationSectionCards stats={stats} />

      {/* Tabs */}
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="members" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
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
            <OrganizationMembers orgId={orgId} canManage={canManage} isAdmin={isAdmin} />
          </TabsContent>
          
          <TabsContent value="site" className="mt-6">
            <OrganizationSite orgId={orgId} canManage={canManage} />
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

