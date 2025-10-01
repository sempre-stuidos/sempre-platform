"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconClock,
  IconCalendar,
  IconUser,
  IconMail,
  IconMapPin,
  IconBriefcase,
  IconUsers,
  IconChecklist,
  IconAlertCircle,
  IconLayoutGrid,
  IconLayoutList,
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
import { z } from "zod"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const teamMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
  status: z.string(),
  email: z.string(),
  timezone: z.string(),
  avatar: z.string(),
  skills: z.array(z.string()),
  currentProjects: z.number(),
  activeTasks: z.number(),
  upcomingDeadlines: z.array(z.object({
    project: z.string(),
    deadline: z.string(),
    type: z.string(),
  })),
  workload: z.number(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof teamMemberSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
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
    cell: ({ row, table }) => {
      const onViewProfile = (table.options.meta as any)?.onViewProfile
      return <TeamMemberCellViewer item={row.original} onViewProfile={onViewProfile} />
    },
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
        <Progress value={row.original.workload} className="w-16 h-2" />
        <span className="text-sm text-muted-foreground w-8">
          {row.original.workload}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: "currentProjects",
    header: "Projects",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.currentProjects}
      </div>
    ),
  },
  {
    accessorKey: "activeTasks",
    header: "Tasks",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.activeTasks}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const onViewProfile = (table.options.meta as any)?.onViewProfile
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onViewProfile(row.original)}>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Assign to Project</DropdownMenuItem>
            <DropdownMenuItem>Edit Member</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof teamMemberSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function TeamDataTable({
  data: initialData,
}: {
  data: z.infer<typeof teamMemberSchema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedMember, setSelectedMember] = React.useState<z.infer<typeof teamMemberSchema> | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const handleViewProfile = (member: z.infer<typeof teamMemberSchema>) => {
    setSelectedMember(member)
    setIsProfileModalOpen(true)
  }

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
    getRowId: (row) => row.id.toString(),
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
    meta: {
      onViewProfile: handleViewProfile,
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const activeMembers = data.filter(member => member.status === "Active").length
  const contractorMembers = data.filter(member => member.status === "Contractor").length
  const pastMembers = data.filter(member => member.status === "Past Collaborator").length

  return (
    <>
      <Tabs
        defaultValue="all"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="all">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="contractors">Contractors</SelectItem>
              <SelectItem value="past">Past Collaborators</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all">All Members</TabsTrigger>
            <TabsTrigger value="active">
              Active <Badge variant="secondary">{activeMembers}</Badge>
            </TabsTrigger>
            <TabsTrigger value="contractors">
              Contractors <Badge variant="secondary">{contractorMembers}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past">
              Past <Badge variant="secondary">{pastMembers}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <IconLayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <IconLayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
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
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Add Member</span>
            </Button>
          </div>
        </div>
        <TabsContent
          value="all"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          {viewMode === 'list' ? (
            <div className="overflow-hidden rounded-lg border">
              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
                id={sortableId}
              >
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} colSpan={header.colSpan}>
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
                  <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {table.getRowModel().rows?.length ? (
                      <SortableContext
                        items={dataIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TeamMemberCard key={row.id} member={row.original} onViewProfile={handleViewProfile} />
                ))
              ) : (
                <div className="col-span-full h-24 text-center flex items-center justify-center text-muted-foreground">
                  No results.
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
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
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="active"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent value="contractors" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
          value="past"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>

      {/* Team Member Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Team Member Profile</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              {/* Header with Basic Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                  <AvatarFallback className="text-lg">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMember.name}</h2>
                    <p className="text-lg text-muted-foreground">{selectedMember.role}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <IconMail className="h-4 w-4" />
                      <span>{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4" />
                      <span>{selectedMember.timezone}</span>
                    </div>
                    <Badge variant={selectedMember.status === "Active" ? "default" : "secondary"} className="ml-2">
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconUsers className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Current Projects</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{selectedMember.currentProjects}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconChecklist className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Active Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{selectedMember.activeTasks}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconBriefcase className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Workload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-orange-600">{selectedMember.workload}%</div>
                    <Progress value={selectedMember.workload} className="flex-1 h-2" />
                  </div>
                </div>
              </div>

              {/* Skills and Deadlines in Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Skills */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Skills & Specialization
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <IconAlertCircle className="h-4 w-4" />
                    Upcoming Deadlines
                  </h3>
                  {selectedMember.upcomingDeadlines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMember.upcomingDeadlines.map((deadline, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{deadline.project}</div>
                            <div className="text-xs text-muted-foreground">{deadline.type}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{deadline.deadline}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function TeamMemberCellViewer({ item, onViewProfile }: { item: z.infer<typeof teamMemberSchema>, onViewProfile: (member: z.infer<typeof teamMemberSchema>) => void }) {
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
      onClick={() => onViewProfile(item)}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={item.avatar} alt={item.name} />
        <AvatarFallback>
          {item.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-muted-foreground">{item.email}</div>
      </div>
    </div>
  )
}

function TeamMemberCard({ member, onViewProfile }: { member: z.infer<typeof teamMemberSchema>, onViewProfile: (member: z.infer<typeof teamMemberSchema>) => void }) {
  const statusColors = {
    "Active": "bg-green-100 text-green-800 border-green-200",
    "Contractor": "bg-blue-100 text-blue-800 border-blue-200",
    "Past Collaborator": "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewProfile(member)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{member.name}</CardTitle>
              <CardDescription className="text-sm">{member.role}</CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`px-1.5 text-xs ${statusColors[member.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
          >
            {member.status === "Active" ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 h-3 w-3" />
            ) : member.status === "Contractor" ? (
              <IconBriefcase className="mr-1 h-3 w-3" />
            ) : (
              <IconClock className="mr-1 h-3 w-3" />
            )}
            {member.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconMail className="h-4 w-4" />
            <span className="truncate">{member.email}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Workload</span>
              <span>{member.workload}%</span>
            </div>
            <Progress value={member.workload} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{member.currentProjects}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconChecklist className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{member.activeTasks}</div>
                <div className="text-xs text-muted-foreground">Tasks</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {member.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{member.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
