"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconTrash, IconEdit } from "@tabler/icons-react"
import { toast } from "sonner"

interface OrganizationMembersProps {
  orgId: string
  canManage: boolean
}

interface Member {
  id: number
  user_id: string
  role: 'owner' | 'admin' | 'staff' | 'client'
  email?: string
  profile?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

export function OrganizationMembers({ orgId, canManage }: OrganizationMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/organizations/${orgId}/members`)
        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }
        const { members: membersData } = await response.json()
        setMembers(membersData || [])
      } catch (error) {
        console.error('Error fetching members:', error)
        toast.error('Failed to load members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [orgId])

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      setMembers(members.filter(m => m.user_id !== userId))
      toast.success('Member removed successfully')
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading members...</div>
        </CardContent>
      </Card>
    )
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Members</CardTitle>
          <CardDescription>
            This organization doesn't have any members yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.profile?.full_name || member.email || 'Unknown User'}
              </TableCell>
              <TableCell>
                {member.email || member.user_id}
              </TableCell>
              <TableCell>
                <Badge>{member.role}</Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(member.user_id)}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

