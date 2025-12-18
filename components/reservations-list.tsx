"use client"

import * as React from "react"
import { IconCheck, IconX, IconCircleCheckFilled, IconClock, IconArchive, IconLayoutColumns, IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ReservationSettingsDialog } from "@/components/reservation-settings-dialog"
import { IconSettings } from "@tabler/icons-react"

interface Reservation {
  id: string // UUID
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

async function approveReservation(reservationId: string) {
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

async function rejectReservation(reservationId: string, rejectionReason: string, sendEmail: boolean) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rejectionReason,
        sendEmail,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reject reservation')
    }

    toast.success(sendEmail ? 'Reservation rejected and customer notified' : 'Reservation rejected')
    // Reload the page to refresh the data
    window.location.reload()
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to reject reservation')
  }
}

async function cancelReservation(reservationId: string) {
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

async function markAsCompleted(reservationId: string) {
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

async function archiveReservation(reservationId: string) {
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

function ReservationDetailModal({ 
  reservation, 
  isOpen, 
  onClose,
  onRejectClick
}: { 
  reservation: Reservation | null
  isOpen: boolean
  onClose: () => void
  onRejectClick?: (reservation: Reservation) => void
}) {
  if (!reservation) return null

  const handleAction = async (action: () => Promise<void>) => {
    await action()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reservation Details</DialogTitle>
          <DialogDescription>
            View and manage reservation information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
              <div className="text-base font-semibold">{reservation.customer_name}</div>
              <div className="text-sm text-muted-foreground">{reservation.customer_email}</div>
              {reservation.customer_phone && (
                <div className="text-sm text-muted-foreground">{reservation.customer_phone}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Date</div>
                <div className="text-sm">{formatDate(reservation.reservation_date)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Time</div>
                <div className="text-sm">{formatTime(reservation.reservation_time)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Party Size</div>
                <div className="text-sm">
                  {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <div>{getStatusBadge(reservation.status)}</div>
              </div>
            </div>

            {reservation.special_requests && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Special Requests</div>
                <div className="text-sm bg-muted p-3 rounded-md">{reservation.special_requests}</div>
              </div>
            )}

            {reservation.approved_by && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Approved By</div>
                <div className="text-sm">{reservation.approved_by}</div>
                {reservation.approved_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(reservation.approved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-2">Actions</div>
            {reservation.status === 'pending' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(() => approveReservation(reservation.id))}
                  className="gap-1.5 flex-1"
                >
                  <IconCheck className="size-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    if (onRejectClick) {
                      onRejectClick(reservation)
                    }
                  }}
                  className="gap-1.5 text-destructive hover:text-destructive flex-1"
                >
                  <IconX className="size-4" />
                  Reject
                </Button>
              </div>
            )}
            {reservation.status === 'approved' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(() => markAsCompleted(reservation.id))}
                  className="gap-1.5 flex-1"
                >
                  <IconCircleCheckFilled className="size-4" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => cancelReservation(reservation.id))}
                  className="gap-1.5 text-destructive hover:text-destructive flex-1"
                >
                  <IconX className="size-4" />
                  Cancel
                </Button>
              </div>
            )}
            {reservation.status === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => archiveReservation(reservation.id))}
                className="gap-1.5"
              >
                <IconArchive className="size-4" />
                Archive
              </Button>
            )}
            {reservation.status === 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => archiveReservation(reservation.id))}
                className="gap-1.5"
              >
                <IconArchive className="size-4" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type RejectionReason = 'No availability' | 'Outside operating hours' | 'Party size too large' | 'Other'

function RejectionModal({
  reservation,
  isOpen,
  onClose,
  onReject,
}: {
  reservation: Reservation | null
  isOpen: boolean
  onClose: () => void
  onReject: (reason: RejectionReason, sendEmail: boolean) => void
}) {
  const [selectedReason, setSelectedReason] = React.useState<RejectionReason | null>(null)
  const [showConfirmation, setShowConfirmation] = React.useState(false)

  const rejectionReasons: RejectionReason[] = [
    'No availability',
    'Outside operating hours',
    'Party size too large',
    'Other'
  ]

  const handleReasonSelect = (reason: RejectionReason) => {
    setSelectedReason(reason)
    setShowConfirmation(true)
  }

  const handleRejectWithoutEmail = () => {
    if (reservation) {
      onReject('Other', false)
      onClose()
    }
  }

  const handleConfirmReject = () => {
    if (selectedReason && reservation) {
      onReject(selectedReason, true)
      onClose()
      setSelectedReason(null)
      setShowConfirmation(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setSelectedReason(null)
  }

  if (!reservation) return null

  return (
    <>
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reject Reservation</DialogTitle>
            <DialogDescription>
              Select a reason for rejecting this reservation or reject without sending an email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {rejectionReasons.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReasonSelect(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectWithoutEmail}
            >
              Reject without email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will receive an email notification about the rejection with the reason: <strong>{selectedReason}</strong>. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReject}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ReservationsTable({ 
  reservations, 
  statusFilter,
  sortBy,
  onReservationClick,
  onRejectClick
}: { 
  reservations: Reservation[]
  statusFilter: StatusFilter
  sortBy: SortOption
  onReservationClick: (reservation: Reservation) => void
  onRejectClick: (reservation: Reservation) => void
}) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 7

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

  // Reset to page 1 when filters or sort change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortBy])

  // Calculate pagination
  const totalPages = Math.ceil(sortedReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReservations = sortedReservations.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (sortedReservations.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No reservations found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Party Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReservations.map((reservation) => (
            <TableRow 
              key={reservation.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onReservationClick(reservation)}
            >
              <TableCell>
                <span className="font-medium text-foreground">{reservation.customer_name}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">{formatDate(reservation.reservation_date)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{formatTime(reservation.reservation_time)}</span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(reservation.status)}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      onClick={(e) => {
                        e.stopPropagation()
                        onRejectClick(reservation)
                      }}
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-card">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedReservations.length)} of {sortedReservations.length} reservations
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <IconChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = []
                
                // Always show first page
                if (currentPage > 3) {
                  pages.push(1)
                  if (currentPage > 4) {
                    pages.push('...')
                  }
                }
                
                // Show pages around current
                const start = Math.max(1, currentPage - 1)
                const end = Math.min(totalPages, currentPage + 1)
                for (let i = start; i <= end; i++) {
                  pages.push(i)
                }
                
                // Always show last page
                if (currentPage < totalPages - 2) {
                  if (currentPage < totalPages - 3) {
                    pages.push('...')
                  }
                  pages.push(totalPages)
                }
                
                return pages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  )
                })
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReservationsCalendar({ 
  reservations, 
  statusFilter,
  viewModeToggle,
  reservationSettingsButton,
  onReservationClick
}: { 
  reservations: Reservation[]
  statusFilter: StatusFilter
  viewModeToggle: React.ReactNode
  reservationSettingsButton: React.ReactNode
  onReservationClick: (reservation: Reservation) => void
}) {
  // Filter by status
  let filteredReservations = reservations
  if (statusFilter !== 'all') {
    filteredReservations = reservations.filter(r => r.status === statusFilter)
  }

  // Group reservations by date
  const reservationsByDate = React.useMemo(() => {
    const grouped: Record<string, Reservation[]> = {}
    filteredReservations.forEach(reservation => {
      const dateKey = reservation.reservation_date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(reservation)
    })
    return grouped
  }, [filteredReservations])

  // Get current week (start of week - Sunday)
  const [currentDate, setCurrentDate] = React.useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day // Get Sunday of current week
    const sunday = new Date(today)
    sunday.setDate(diff)
    return sunday
  })

  // Get the week's dates (Sunday to Saturday)
  const weekDates = React.useMemo(() => {
    const weekDates: Date[] = []
    const startOfWeek = new Date(currentDate)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }, [currentDate])

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    const sunday = new Date(today)
    sunday.setDate(diff)
    setCurrentDate(sunday)
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Format week range for display
  const weekRange = React.useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const start = weekDates[0]
    const end = weekDates[6]
    const startMonth = monthNames[start.getMonth()]
    const endMonth = monthNames[end.getMonth()]
    const startDay = start.getDate()
    const endDay = end.getDate()
    const year = start.getFullYear()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
    }
  }, [weekDates])

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return reservationsByDate[dateKey] || []
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  if (filteredReservations.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No reservations found for the selected filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card flex flex-col" style={{ height: '700px' }}>
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="ml-4 text-lg font-semibold">
              {weekRange}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {viewModeToggle}
            {reservationSettingsButton}
          </div>
        </div>
      </div>
      <div className="p-1 flex-1 overflow-hidden min-h-0">
        <div className="grid grid-cols-7 gap-2 h-full">
          {dayNames.map((day, index) => {
            const date = weekDates[index]
            const dayReservations = getReservationsForDate(date)
            const isTodayDate = isToday(date)
            const dayNumber = date.getDate()
            const isCurrentMonth = date.getMonth() === new Date().getMonth()
            
            return (
              <div key={index} className="flex flex-col min-h-0">
                <div className={`p-2 text-center border-b flex-shrink-0 ${isTodayDate ? 'bg-primary/10 border-primary' : 'border-border'}`}>
                  <div className="text-xs font-medium text-muted-foreground mb-1">{day}</div>
                  <div className={`text-lg font-semibold ${isTodayDate ? 'text-primary' : isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                    {dayNumber}
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 p-2 overflow-y-auto min-h-0">
                  {dayReservations.map(reservation => (
                    <div
                      key={reservation.id}
                      className="text-xs p-2 rounded bg-muted cursor-pointer hover:bg-muted/80 border border-border"
                      title={`${reservation.customer_name} - ${formatTime(reservation.reservation_time)} - ${reservation.party_size} guests`}
                      onClick={() => onReservationClick(reservation)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="font-medium truncate">{reservation.customer_name}</div>
                      <div className="text-muted-foreground">{formatTime(reservation.reservation_time)}</div>
                      <div className="text-muted-foreground text-[16px]">{reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}</div>
                    </div>
                  ))}
                  {dayReservations.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No reservations
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ReservationsList({ upcomingReservations, pastReservations, orgId }: ReservationsListProps) {
  const allReservations = [...upcomingReservations, ...pastReservations]
  // Keep filter and sort state for internal use, but set to defaults (no UI controls)
  const [statusFilter] = React.useState<StatusFilter>('all')
  const [sortBy] = React.useState<SortOption>('date-asc')
  const [activeTab, setActiveTab] = React.useState('upcoming')
  const [viewMode, setViewMode] = React.useState<'table' | 'calendar'>('table')
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [rejectionReservation, setRejectionReservation] = React.useState<Reservation | null>(null)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedReservation(null)
  }

  const handleRejectClick = (reservation: Reservation) => {
    setRejectionReservation(reservation)
    setIsRejectionModalOpen(true)
  }

  const handleReject = async (reason: RejectionReason, sendEmail: boolean) => {
    if (rejectionReservation) {
      await rejectReservation(rejectionReservation.id, reason, sendEmail)
      setIsRejectionModalOpen(false)
      setRejectionReservation(null)
    }
  }

  // Create reusable control components
  const tabsList = (
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
  )

  const viewModeToggle = (
    <div className="flex items-center border rounded-md">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('table')}
        className="rounded-r-none"
      >
        <IconLayoutColumns className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant={viewMode === 'calendar' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('calendar')}
        className="rounded-l-none border-l"
      >
        <IconCalendar className="h-4 w-4 mr-2" />
        Calendar
      </Button>
    </div>
  )

  const reservationSettingsButton = (
    <ReservationSettingsDialog orgId={orgId}>
      <Button variant="outline" size="sm" className="gap-2">
        <IconSettings className="h-4 w-4" />
        Reservation Settings
      </Button>
    </ReservationSettingsDialog>
  )

  return (
    <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full flex-col justify-start gap-6">
      {/* TabsList must be a direct child of Tabs - conditionally render controls based on view mode */}
      {viewMode === 'table' ? (
        <div className="flex items-center justify-between px-4 lg:px-6">
          {tabsList}
          <div className="flex items-center gap-2">
            {viewModeToggle}
            {reservationSettingsButton}
          </div>
        </div>
      ) : (
        // Render TabsList here but it will be moved to calendar header via props
        <div className="hidden">
          {tabsList}
        </div>
      )}
      <TabsContent value="upcoming" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {viewMode === 'table' ? (
          <ReservationsTable 
            reservations={upcomingReservations} 
            statusFilter={statusFilter}
            sortBy={sortBy}
            onReservationClick={handleReservationClick}
            onRejectClick={handleRejectClick}
          />
        ) : (
          <ReservationsCalendar 
            reservations={upcomingReservations} 
            statusFilter={statusFilter}
            viewModeToggle={viewModeToggle}
            reservationSettingsButton={reservationSettingsButton}
            onReservationClick={handleReservationClick}
          />
        )}
      </TabsContent>
      <TabsContent value="past" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {viewMode === 'table' ? (
          <ReservationsTable 
            reservations={pastReservations} 
            statusFilter={statusFilter}
            sortBy={sortBy}
            onReservationClick={handleReservationClick}
            onRejectClick={handleRejectClick}
          />
        ) : (
          <ReservationsCalendar 
            reservations={pastReservations} 
            statusFilter={statusFilter}
            viewModeToggle={viewModeToggle}
            reservationSettingsButton={reservationSettingsButton}
            onReservationClick={handleReservationClick}
          />
        )}
      </TabsContent>
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {viewMode === 'table' ? (
          <ReservationsTable 
            reservations={allReservations} 
            statusFilter={statusFilter}
            sortBy={sortBy}
            onReservationClick={handleReservationClick}
            onRejectClick={handleRejectClick}
          />
        ) : (
          <ReservationsCalendar 
            reservations={allReservations} 
            statusFilter={statusFilter}
            viewModeToggle={viewModeToggle}
            reservationSettingsButton={reservationSettingsButton}
            onReservationClick={handleReservationClick}
          />
        )}
      </TabsContent>
      <ReservationDetailModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRejectClick={handleRejectClick}
      />
      <RejectionModal
        reservation={rejectionReservation}
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false)
          setRejectionReservation(null)
        }}
        onReject={handleReject}
      />
    </Tabs>
  )
}

