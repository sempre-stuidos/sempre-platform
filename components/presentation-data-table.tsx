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
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconPlus,
  IconClock,
  IconCalendar,
  IconX,
  IconExternalLink,
  IconEye,
  IconEdit,
  IconTrash,
  IconCopy,
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

import Link from "next/link"
import { Presentation } from "@/lib/types"
import { PresentationDrawer } from "./presentation-drawer"
import { AddPresentationModal } from "./add-presentation-modal"
import { deletePresentation, getClients, getTeamMembersWithCurrentUser } from "@/lib/presentations"
import { useCurrentUser } from "@/hooks/use-current-user"
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

const columns: ColumnDef<Presentation>[] = [
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
    accessorKey: "title",
    header: "Title",
    cell: ({ row, table }) => {
      const presentation = row.original
      const onPresentationClick = (table.options.meta as any)?.onPresentationClick
      return (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onPresentationClick?.(presentation)}
            className="font-medium text-foreground hover:text-primary text-left"
          >
            {presentation.title}
          </button>
          <Link
            href={`/clients/${presentation.clientId}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {presentation.clientName}
          </Link>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      const typeColors = {
        "Proposal": "bg-blue-100 text-blue-800 border-blue-200",
        "Onboarding": "bg-green-100 text-green-800 border-green-200",
        "Progress Update": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Report": "bg-purple-100 text-purple-800 border-purple-200",
        "Case Study": "bg-orange-100 text-orange-800 border-orange-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdDate",
    header: "Created",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {new Date(row.original.createdDate).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.ownerName}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusColors = {
        "Draft": "bg-gray-100 text-gray-800 border-gray-200",
        "Sent": "bg-blue-100 text-blue-800 border-blue-200",
        "Approved": "bg-green-100 text-green-800 border-green-200",
        "Archived": "bg-red-100 text-red-800 border-red-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {status === "Approved" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : status === "Sent" ? (
            <IconClock className="mr-1" />
          ) : status === "Draft" ? (
            <IconEdit className="mr-1" />
          ) : (
            <IconX className="mr-1" />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="h-8 w-8 p-0"
      >
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary"
        >
          <IconExternalLink className="size-4" />
          <span className="sr-only">Open presentation</span>
        </a>
      </Button>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const presentation = row.original
      const onEditClick = (table.options.meta as any)?.onEditClick
      const onDeleteClick = (table.options.meta as any)?.onDeleteClick
      
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
            <DropdownMenuItem onClick={() => onEditClick?.(presentation)}>
              <IconEdit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconCopy className="mr-2 size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive"
              onClick={() => onDeleteClick?.(presentation)}
            >
              <IconTrash className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<Presentation> }) {
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

export function PresentationDataTable({
  data: initialData,
}: {
  data: Presentation[]
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
  const [selectedPresentation, setSelectedPresentation] = React.useState<Presentation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingPresentation, setEditingPresentation] = React.useState<Presentation | null>(null)
  const [clients, setClients] = React.useState<{ id: number; name: string }[]>([])
  const [teamMembers, setTeamMembers] = React.useState<{ id: number; name: string; isCurrentUser?: boolean }[]>([])
  const { currentUser } = useCurrentUser()
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

  const handlePresentationClick = (presentation: Presentation) => {
    setSelectedPresentation(presentation)
    setIsDrawerOpen(true)
  }

  const handleCreatePresentation = () => {
    setEditingPresentation(null)
    setIsModalOpen(true)
  }

  const handleEditPresentation = (presentation: Presentation) => {
    setEditingPresentation(presentation)
    setIsModalOpen(true)
  }

  const handleDeletePresentation = async (presentation: Presentation) => {
    if (window.confirm(`Are you sure you want to delete "${presentation.title}"?`)) {
      try {
        await deletePresentation(presentation.id)
        toast.success("Presentation deleted successfully")
        // Refresh the data by calling the parent's refresh function
        window.location.reload() // Simple refresh for now
      } catch (error) {
        console.error("Error deleting presentation:", error)
        toast.error("Failed to delete presentation")
      }
    }
  }

  const handleModalSuccess = () => {
    // Refresh the data by calling the parent's refresh function
    window.location.reload() // Simple refresh for now
  }

  // Load clients and team members on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, teamMembersData] = await Promise.all([
          getClients(),
          getTeamMembersWithCurrentUser(currentUser?.id)
        ])
        setClients(clientsData)
        setTeamMembers(teamMembersData)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [currentUser])

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
      onPresentationClick: handlePresentationClick,
      onEditClick: handleEditPresentation,
      onDeleteClick: handleDeletePresentation,
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

  // Get unique values for filters
  const statusValues = React.useMemo(() => {
    const values = table.getColumn("status")?.getFacetedUniqueValues() ?? new Map()
    return Array.from(values.keys()).sort()
  }, [table])

  const typeValues = React.useMemo(() => {
    const values = table.getColumn("type")?.getFacetedUniqueValues() ?? new Map()
    return Array.from(values.keys()).sort()
  }, [table])

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search presentations..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn("type")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleCreatePresentation}>
          <IconPlus />
          <span className="hidden lg:inline">Create Presentation</span>
        </Button>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-6">
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
      </div>

      <PresentationDrawer
        presentation={selectedPresentation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <AddPresentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        presentation={editingPresentation}
        clients={clients}
        teamMembers={teamMembers}
      />
    </div>
  )
}
