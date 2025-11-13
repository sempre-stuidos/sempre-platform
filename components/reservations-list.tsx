"use client"

import * as React from "react"
import { IconCheck, IconX, IconCircleCheckFilled, IconClock, IconArchive } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Reservation {
  id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: 'pending' | 'approved' | 'cancelled' | 'completed'
  special_requests?: string
  approved_by?: string
  approved_at?: string
}

interface ReservationsListProps {
  upcomingReservations: Reservation[]
  pastReservations: Reservation[]
  orgId: string
}

type SortOption = 'date-asc' | 'date-desc' | 'party-asc' | 'party-desc'
type StatusFilter = 'all' | 'pending' | 'approved' | 'completed' | 'cancelled'

function getStatusBadge(status: Reservation['status']) {
  const statusConfig = {
    'pending': {
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <IconClock className="mr-1 size-3" />,
      label: 'Pending'
    },
    'approved': {
      colors: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <IconCircleCheckFilled className="fill-blue-500 dark:fill-blue-400 mr-1 size-3" />,
      label: 'Approved'
    },
    'completed': {
      colors: 'bg-green-100 text-green-800 border-green-200',
      icon: <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 size-3" />,
      label: 'Completed'
    },
    'cancelled': {
      colors: 'bg-red-100 text-red-800 border-red-200',
      icon: <IconX className="mr-1 size-3" />,
      label: 'Cancelled'
    }
  }

  const config = statusConfig[status] || {
    colors: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: null,
    label: status
  }

  return (
    <Badge 
      variant="outline" 
      className={`px-1.5 ${config.colors}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(timeString: string): string {
  // Time is in HH:MM:SS format, convert to 12-hour format
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

async function approveReservation(reservationId: number) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to approve reservation')
    }

    toast.success('Reservation approved and confirmation email sent')
    // Reload the page to refresh the data
    window.location.reload()
  } catch (error) {
    console.error('Error approving reservation:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to approve reservation')
  }
}

async function rejectReservation(reservationId: number) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reject reservation')
    }

    toast.success('Reservation rejected')
    // Reload the page to refresh the data
    window.location.reload()
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to reject reservation')
  }
}

async function cancelReservation(reservationId: number) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel reservation')
    }

    toast.success('Reservation cancelled')
    window.location.reload()
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to cancel reservation')
  }
}

async function markAsCompleted(reservationId: number) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to mark reservation as completed')
    }

    toast.success('Reservation marked as completed')
    window.location.reload()
  } catch (error) {
    console.error('Error marking reservation as completed:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to mark reservation as completed')
  }
}

async function archiveReservation(reservationId: number) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to archive reservation')
    }

    toast.success('Reservation archived')
    window.location.reload()
  } catch (error) {
    console.error('Error archiving reservation:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to archive reservation')
  }
}

function ReservationsTable({ 
  reservations, 
  orgId,
  statusFilter,
  sortBy 
}: { 
  reservations: Reservation[]
  orgId: string
  statusFilter: StatusFilter
  sortBy: SortOption
}) {
  // Filter by status
  let filteredReservations = reservations
  if (statusFilter !== 'all') {
    filteredReservations = reservations.filter(r => r.status === statusFilter)
  }

  // Sort reservations
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (sortBy === 'date-asc' || sortBy === 'date-desc') {
      const dateA = new Date(`${a.reservation_date}T${a.reservation_time}`)
      const dateB = new Date(`${b.reservation_date}T${b.reservation_time}`)
      return sortBy === 'date-asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    } else if (sortBy === 'party-asc' || sortBy === 'party-desc') {
      return sortBy === 'party-asc'
        ? a.party_size - b.party_size
        : b.party_size - a.party_size
    }
    return 0
  })

  if (sortedReservations.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No reservations found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Party Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Special Requests</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{reservation.customer_name}</span>
                  <span className="text-sm text-muted-foreground">{reservation.customer_email}</span>
                  {reservation.customer_phone && (
                    <span className="text-sm text-muted-foreground">{reservation.customer_phone}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{formatDate(reservation.reservation_date)}</span>
                  <span className="text-sm text-muted-foreground">{formatTime(reservation.reservation_time)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(reservation.status)}</TableCell>
              <TableCell>
                {reservation.special_requests ? (
                  <span className="text-sm text-muted-foreground">{reservation.special_requests}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {reservation.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => approveReservation(reservation.id)}
                      className="gap-1.5"
                    >
                      <IconCheck className="size-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectReservation(reservation.id)}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <IconX className="size-4" />
                      Reject
                    </Button>
                  </div>
                )}
                {reservation.status === 'approved' && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => markAsCompleted(reservation.id)}
                      className="gap-1.5"
                    >
                      <IconCircleCheckFilled className="size-4" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelReservation(reservation.id)}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <IconX className="size-4" />
                      Cancel
                    </Button>
                  </div>
                )}
                {reservation.status === 'completed' && (
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveReservation(reservation.id)}
                      className="gap-1.5"
                    >
                      <IconArchive className="size-4" />
                      Archive
                    </Button>
                  </div>
                )}
                {reservation.status === 'cancelled' && (
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveReservation(reservation.id)}
                      className="gap-1.5"
                    >
                      <IconArchive className="size-4" />
                      Archive
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ReservationsList({ upcomingReservations, pastReservations, orgId }: ReservationsListProps) {
  const allReservations = [...upcomingReservations, ...pastReservations]
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [sortBy, setSortBy] = React.useState<SortOption>('date-asc')
  const [activeTab, setActiveTab] = React.useState('upcoming')

  return (
    <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
          <TabsTrigger value="upcoming">
            Upcoming <Badge variant="secondary">{upcomingReservations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past <Badge variant="secondary">{pastReservations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            All <Badge variant="secondary">{allReservations.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date & Time ↑</SelectItem>
              <SelectItem value="date-desc">Date & Time ↓</SelectItem>
              <SelectItem value="party-asc">Party Size ↑</SelectItem>
              <SelectItem value="party-desc">Party Size ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <TabsContent value="upcoming" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <ReservationsTable 
          reservations={upcomingReservations} 
          orgId={orgId}
          statusFilter={statusFilter}
          sortBy={sortBy}
        />
      </TabsContent>
      <TabsContent value="past" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <ReservationsTable 
          reservations={pastReservations} 
          orgId={orgId}
          statusFilter={statusFilter}
          sortBy={sortBy}
        />
      </TabsContent>
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <ReservationsTable 
          reservations={allReservations} 
          orgId={orgId}
          statusFilter={statusFilter}
          sortBy={sortBy}
        />
      </TabsContent>
    </Tabs>
  )
}

