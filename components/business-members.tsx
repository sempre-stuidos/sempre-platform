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
import { IconTrash, IconEdit, IconMail } from "@tabler/icons-react"
import { toast } from "sonner"
import { EditMemberModal } from "@/components/edit-member-modal"

interface BusinessMembersProps {
  orgId: string
  canManage: boolean
  isAdmin?: boolean
}

interface Member {
  id: number
  user_id: string
  role: 'owner' | 'admin' | 'staff' | 'client'
  email?: string
  needs_password?: boolean
  profile?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

export function BusinessMembers({ orgId, canManage, isAdmin = false }: BusinessMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [sendingCodes, setSendingCodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/members`)
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

  const handleEdit = (member: Member) => {
    setSelectedMember(member)
    setShowEditModal(true)
  }

  const handleEditSuccess = () => {
    // Refresh members list
    fetch(`/api/businesses/${orgId}/members`)
      .then(res => res.json())
      .then(data => {
        if (data.members) {
          setMembers(data.members)
        }
      })
      .catch(err => console.error('Error refreshing members:', err))
  }

  const handleDelete = async (userId: string, memberRole: string) => {
    // Prevent deleting owners unless user is Admin
    if (memberRole === 'owner' && !isAdmin) {
      toast.error('Cannot delete business owners')
      return
    }

    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}/members/${userId}`, {
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

  const handleSendCode = async (member: Member) => {
    if (!member.email) {
      toast.error('Member email not available')
      return
    }

    setSendingCodes(prev => new Set(prev).add(member.user_id))

    try {
      const response = await fetch(`/api/businesses/${orgId}/members/${member.user_id}/send-code`, {
        method: 'POST',
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // If not JSON, get text response
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send code')
      }

      // Check if email sending failed but code was generated
      if (data.error && data.success) {
        toast.warning(data.message || 'Code generated but email failed to send')
        if (data.code) {
          console.log('Login code (dev mode):', data.code)
        }
      } else {
        toast.success(data.message || 'Login code sent successfully!')
      }
    } catch (error) {
      console.error('Error sending code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send login code')
    } finally {
      setSendingCodes(prev => {
        const next = new Set(prev)
        next.delete(member.user_id)
        return next
      })
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
            This business doesn&apos;t have any members, staff, or clients yet. Add members to give them access to the client dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(member)}
                        title="Edit member"
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      {/* Show Send Code button for members who need password setup */}
                      {member.needs_password && member.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendCode(member)}
                          disabled={sendingCodes.has(member.user_id)}
                          title="Send login code"
                        >
                          <IconMail className={`h-4 w-4 ${sendingCodes.has(member.user_id) ? 'animate-pulse' : ''}`} />
                        </Button>
                      )}
                      {/* Allow Admins to delete owners, but regular users cannot delete owners */}
                      {(isAdmin || member.role !== 'owner') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.user_id, member.role)}
                          title="Delete member"
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
      
      <EditMemberModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        orgId={orgId}
        member={selectedMember}
        onSuccess={handleEditSuccess}
      />
    </>
  )
}

