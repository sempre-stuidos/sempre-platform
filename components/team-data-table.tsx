"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconClock,
  IconUser,
  IconBriefcase,
  IconTrash,
  IconEdit,
  IconEye,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamMember } from "@/lib/types"
import { updateTeamMember, deleteTeamMember } from "@/lib/team"
import { AddTeamMemberModal } from "@/components/add-team-member-modal"
import { AddExistingUserModal } from "@/components/add-existing-user-modal"

// Bulk Actions Floating Bar Component
function BulkActionsBar({ 
  selectedRows, 
  onDeleteSelected, 
  onClearSelection 
}: { 
  selectedRows: Row<TeamMember>[], 
  onDeleteSelected: () => void,
  onClearSelection: () => void 
}) {
  if (selectedRows.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedRows.length} team member{selectedRows.length > 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="h-8"
          >
            <IconTrash className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}

// Create columns with CRUD actions
function createColumns(
  handleEditTeamMember: (teamMember: TeamMember) => void,
  handleDeleteTeamMember: (teamMember: TeamMember) => void,
  handleViewProfile: (teamMember: TeamMember) => void
): ColumnDef<TeamMember>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Team Member",
      cell: ({ row }) => <TeamMemberCellViewer item={row.original} onViewProfile={handleViewProfile} />,
      enableHiding: false,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.role}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const statusColors = {
          "Active": "bg-green-100 text-green-800 border-green-200",
          "Contractor": "bg-blue-100 text-blue-800 border-blue-200",
          "Past Collaborator": "bg-gray-100 text-gray-800 border-gray-200"
        }
        return (
          <Badge 
            variant="outline" 
            className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
          >
            {status === "Active" ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
            ) : status === "Contractor" ? (
              <IconBriefcase className="mr-1" />
            ) : (
              <IconClock className="mr-1" />
            )}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "workload",
      header: "Workload",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.workload || 0} className="w-16 h-2" />
          <span className="text-sm text-muted-foreground w-8">
            {row.original.workload || 0}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "currentProjects",
      header: "Projects",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.currentProjects || 0}
        </div>
      ),
    },
    {
      accessorKey: "activeTasks",
      header: "Tasks",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.activeTasks || 0}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => handleViewProfile(row.original)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditTeamMember(row.original)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteTeamMember(row.original)}
              className="text-red-600"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export function TeamDataTable({
  data: initialData,
}: {
  data: TeamMember[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
  
  // CRUD modal states
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = React.useState(false)
  const [isAddExistingUserModalOpen, setIsAddExistingUserModalOpen] = React.useState(false)
  const [editingTeamMember, setEditingTeamMember] = React.useState<TeamMember | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [teamMemberToDelete, setTeamMemberToDelete] = React.useState<TeamMember | null>(null)

  // CRUD handlers
  const handleAddTeamMember = async () => {
    // Refresh the data to show the newly invited member (if they've already accepted)
    // In most cases, the invitation was just sent, so we'll refresh to show any updates
    try {
      const { getAllTeamMembers } = await import('@/lib/team')
      const updatedData = await getAllTeamMembers()
      setData(updatedData)
    } catch (error: unknown) {
      console.error('Error refreshing team members:', error)
      // Don't show error toast for refresh failures
    }
  }

  const handleUpdateTeamMember = async () => {
    // The modal already handles the update, we just need to refresh the data
    try {
      const { getAllTeamMembers } = await import('@/lib/team')
      const updatedData = await getAllTeamMembers()
      setData(updatedData)
    } catch (error: unknown) {
      // Don't show error toast for refresh failures
      console.error('Error refreshing team members:', error)
    }
  }

  const handleDeleteTeamMember = async (teamMemberId: number) => {
    try {
      const success = await deleteTeamMember(teamMemberId)
      if (success) {
        setData(prev => prev.filter(member => member.id !== teamMemberId))
        toast.success("Team member deleted successfully")
      }
    } catch (error: unknown) {
      console.error('Error deleting team member:', error)
      toast.error(error instanceof Error ? error.message : "Failed to delete team member")
    }
  }

  const openDeleteDialog = (teamMember: TeamMember) => {
    setTeamMemberToDelete(teamMember)
    setDeleteDialogOpen(true)
  }

  const handleEditTeamMember = (teamMember: TeamMember) => {
    setEditingTeamMember(teamMember)
    setIsAddTeamMemberModalOpen(true)
  }

  const handleViewProfile = (teamMember: TeamMember) => {
    setSelectedMember(teamMember)
    setIsProfileModalOpen(true)
  }

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const teamMemberIds = selectedRows.map(row => row.original.id)
    
    try {
      // Delete all selected team members
      await Promise.all(teamMemberIds.map(id => deleteTeamMember(id)))
      
      // Update local state
      setData(prev => prev.filter(member => !teamMemberIds.includes(member.id)))
      
      // Clear selection
      setRowSelection({})
      
      toast.success(`${teamMemberIds.length} team member(s) deleted successfully`)
    } catch (error: unknown) {
      console.error('Error deleting team members:', error)
      toast.error(error instanceof Error ? error.message : "Failed to delete team members")
    }
  }

  const handleClearSelection = () => {
    setRowSelection({})
  }

  const columns = React.useMemo(() => 
    createColumns(handleEditTeamMember, openDeleteDialog, handleViewProfile), 
    [handleEditTeamMember, openDeleteDialog, handleViewProfile]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
            <p className="text-muted-foreground">
              Manage your team members and their workload.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsAddTeamMemberModalOpen(true)} variant="outline">
              <IconPlus className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
            <Button onClick={() => setIsAddExistingUserModalOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Contractor">Contractor</SelectItem>
              <SelectItem value="Past Collaborator">Past Collaborator</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                View
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddTeamMemberModalOpen}
        onClose={() => {
          setIsAddTeamMemberModalOpen(false)
          setEditingTeamMember(null)
        }}
        onAddTeamMember={editingTeamMember ? handleUpdateTeamMember : handleAddTeamMember}
        initialData={editingTeamMember}
        isEdit={!!editingTeamMember}
      />

      {/* Add Existing User Modal */}
      <AddExistingUserModal
        isOpen={isAddExistingUserModalOpen}
        onClose={() => {
          setIsAddExistingUserModalOpen(false)
        }}
        onAddUser={handleAddTeamMember}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{teamMemberToDelete?.name}</strong> from your team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (teamMemberToDelete) {
                  handleDeleteTeamMember(teamMemberToDelete.id)
                  setDeleteDialogOpen(false)
                  setTeamMemberToDelete(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Member Profile</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedMember.avatar ?? undefined} alt={selectedMember.name ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {(selectedMember.name || 'Unknown').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{selectedMember.name || 'Unknown'}</h3>
                  <p className="text-lg text-muted-foreground">{selectedMember.role}</p>
                  <Badge variant="outline">{selectedMember.status}</Badge>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> {selectedMember.email}</p>
                    <p><strong>Timezone:</strong> {selectedMember.timezone}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Workload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedMember.workload || 0}%</div>
                    <Progress value={selectedMember.workload || 0} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedMember.currentProjects || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedMember.activeTasks || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Skills */}
              {selectedMember.skills && selectedMember.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Deadlines */}
              {selectedMember.upcomingDeadlines && selectedMember.upcomingDeadlines.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Upcoming Deadlines</h4>
                  <div className="space-y-2">
                    {selectedMember.upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{deadline.project}</p>
                          <p className="text-sm text-muted-foreground">{deadline.type}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{deadline.deadline}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Floating Bar */}
      <BulkActionsBar
        selectedRows={selectedRows}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={handleClearSelection}
      />
    </>
  )
}

function TeamMemberCellViewer({ 
  item, 
  onViewProfile 
}: { 
  item: TeamMember, 
  onViewProfile: (member: TeamMember) => void 
}) {
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
      onClick={() => onViewProfile(item)}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={item.avatar ?? undefined} alt={item.name ?? undefined} />
        <AvatarFallback className="text-xs">
          {(item.name || 'Unknown').split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.name || 'Unknown'}</span>
        <span className="text-xs text-muted-foreground">{item.email}</span>
      </div>
    </div>
  )
}