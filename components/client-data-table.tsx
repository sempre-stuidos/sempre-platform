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
  IconPlus,
  IconStar,
  IconStarFilled,
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

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AddClientModal } from "@/components/add-client-modal"
import Link from "next/link"
import { Client } from "@/lib/types"
import { createClient, updateClient, deleteClient } from "@/lib/clients"

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

// Define columns outside component to avoid recreation
const createColumns = (onEdit: (client: Client) => void, onDelete: (client: Client) => void): ColumnDef<Client>[] => [
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
    header: "Client Name",
    cell: ({ row }) => {
      return (
        <Link 
          href={`/clients/${row.original.id}`}
          className="text-foreground w-fit px-0 text-left hover:underline"
        >
          {row.original.name}
        </Link>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "businessType",
    header: "Business Type",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.businessType}
        </Badge>
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
        "Past": "bg-gray-100 text-gray-800 border-gray-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {status === "Active" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : null}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "projectCount",
    header: () => <div className="w-full text-center"># of Projects</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="secondary" className="px-2 py-1">
          {row.original.projectCount}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: () => <div className="w-full text-center">Priority</div>,
    cell: ({ row }) => {
      const priority = row.original.priority
      const priorityColors = {
        "High": "bg-red-100 text-red-800 border-red-200",
        "Medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Low": "bg-green-100 text-green-800 border-green-200"
      }
      return (
        <div className="flex items-center justify-center gap-1">
          {priority === "High" && <IconStarFilled className="size-3 text-red-500" />}
          <Badge 
            variant="outline" 
            className={`px-1.5 ${priorityColors[priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
          >
            {priority}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "totalValue",
    header: () => <div className="w-full text-center">Total Value</div>,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground text-center">
        ${row.original.totalValue.toLocaleString()}
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
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem asChild>
            <Link href={`/clients/${row.original.id}`}>View Details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit Client</DropdownMenuItem>
          <DropdownMenuItem>Add Project</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            variant="destructive"
            onClick={() => onDelete(row.original)}
          >
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<Client> }) {
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

export function ClientDataTable({
  data: initialData,
}: {
  data: Client[]
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
  const [isAddClientModalOpen, setIsAddClientModalOpen] = React.useState(false)
  const [isEditClientModalOpen, setIsEditClientModalOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
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

  const handleUpdateClient = async (clientId: number, updates: Partial<Client>) => {
    try {
      const updatedClient = await updateClient(clientId, updates)
      
      if (updatedClient) {
        setData(data.map(client => 
          client.id === clientId ? updatedClient : client
        ))
        toast.success("Client updated successfully")
      } else {
        toast.error("Failed to update client")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast.error("Failed to update client")
    }
  }

  const handleDeleteClient = async (clientId: number) => {
    try {
      const success = await deleteClient(clientId)
      
      if (success) {
        setData(data.filter(client => client.id !== clientId))
        toast.success("Client deleted successfully")
        setDeleteDialogOpen(false)
        setClientToDelete(null)
      } else {
        toast.error("Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client")
    }
  }

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedClients = selectedRows.map(row => row.original)
    
    try {
      const deletePromises = selectedClients.map(client => deleteClient(client.id))
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(Boolean).length
      if (successCount > 0) {
        const deletedIds = selectedClients.slice(0, successCount).map(c => c.id)
        setData(data.filter(client => !deletedIds.includes(client.id)))
        toast.success(`${successCount} client(s) deleted successfully`)
        table.resetRowSelection()
      }
      
      if (successCount < selectedClients.length) {
        toast.error(`Failed to delete ${selectedClients.length - successCount} client(s)`)
      }
    } catch (error) {
      console.error("Error deleting clients:", error)
      toast.error("Failed to delete clients")
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsEditClientModalOpen(true)
  }

  const handleEditSubmit = async (updatedClient: Partial<Client>) => {
    if (editingClient) {
      await handleUpdateClient(editingClient.id, updatedClient)
      setIsEditClientModalOpen(false)
      setEditingClient(null)
    }
  }

  const columns = React.useMemo(
    () => createColumns(handleEditClient, openDeleteDialog),
    [handleEditClient, openDeleteDialog]
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

  const handleAddClient = async (newClient: Partial<Client>) => {
    try {
      const client = await createClient({
        name: newClient.name || "",
        businessType: newClient.businessType || "",
        status: newClient.status || "Active",
        projectCount: 0,
        priority: newClient.priority || "Medium",
        contactEmail: newClient.contactEmail || "",
        lastContact: new Date().toISOString().split('T')[0],
        totalValue: 0,
        phone: newClient.phone,
        address: newClient.address,
        website: newClient.website,
        notes: newClient.notes
      })
      
      if (client) {
        setData([client, ...data])
        toast.success("Client added successfully")
      } else {
        toast.error("Failed to add client")
      }
    } catch (error) {
      console.error("Error adding client:", error)
      toast.error("Failed to add client")
    }
  }

  // Filter data based on active tab
  const getFilteredData = (tabValue: string) => {
    switch (tabValue) {
      case "active":
        return data.filter(client => client.status === "Active")
      case "past":
        return data.filter(client => client.status === "Past")
      case "high-priority":
        return data.filter(client => client.priority === "High")
      default:
        return data
    }
  }

  return (
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
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="high-priority">High Priority</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Clients</TabsTrigger>
          <TabsTrigger value="active">
            Active <Badge variant="secondary">{data.filter(c => c.status === "Active").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past <Badge variant="secondary">{data.filter(c => c.status === "Past").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="high-priority">
            High Priority <Badge variant="secondary">{data.filter(c => c.priority === "High").length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={() => setIsAddClientModalOpen(true)}>
            <IconPlus />
            <span className="hidden lg:inline">Add Client</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
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
      </TabsContent>
      <TabsContent
        value="active"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="text-muted-foreground text-center py-8">
          Active clients view - {data.filter(c => c.status === "Active").length} clients
        </div>
      </TabsContent>
      <TabsContent value="past" className="flex flex-col px-4 lg:px-6">
        <div className="text-muted-foreground text-center py-8">
          Past clients view - {data.filter(c => c.status === "Past").length} clients
        </div>
      </TabsContent>
      <TabsContent
        value="high-priority"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="text-muted-foreground text-center py-8">
          High priority clients view - {data.filter(c => c.priority === "High").length} clients
        </div>
      </TabsContent>
      
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onAddClient={handleAddClient}
      />
      
      {editingClient && (
        <AddClientModal
          isOpen={isEditClientModalOpen}
          onClose={() => {
            setIsEditClientModalOpen(false)
            setEditingClient(null)
          }}
          onAddClient={handleEditSubmit}
          initialData={editingClient}
          isEdit={true}
        />
      )}

      {/* Bulk Actions Bar */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} client(s) selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{clientToDelete?.name}&quot;? This action cannot be undone.
              {clientToDelete?.projectCount && clientToDelete.projectCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Warning:</strong> This client has {clientToDelete.projectCount} active project(s). 
                  Deleting this client may affect related projects.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && handleDeleteClient(clientToDelete.id)}
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the following {table.getFilteredSelectedRowModel().rows.length} client(s)? This action cannot be undone.
              
              <div className="mt-3 max-h-32 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {table.getFilteredSelectedRowModel().rows.map((row) => (
                    <li key={row.original.id} className="flex justify-between">
                      <span>{row.original.name}</span>
                      {row.original.projectCount > 0 && (
                        <span className="text-yellow-600 text-xs">
                          {row.original.projectCount} project(s)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              
              {table.getFilteredSelectedRowModel().rows.some(row => row.original.projectCount > 0) && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Warning:</strong> Some clients have active projects. Deleting these clients may affect related projects.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
            >
              Delete {table.getFilteredSelectedRowModel().rows.length} Client(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

function ClientCellViewer({ client }: { client: Client }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {client.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{client.name}</DrawerTitle>
          <DrawerDescription>
            Client details and project information
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Client Name</Label>
              <Input id="name" defaultValue={client.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="businessType">Business Type</Label>
                <Select defaultValue={client.businessType}>
                  <SelectTrigger id="businessType" className="w-full">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Startup">Startup</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Financial Services">Financial Services</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                    <SelectItem value="Travel & Tourism">Travel & Tourism</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={client.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue={client.priority}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="projectCount">Number of Projects</Label>
                <Input id="projectCount" defaultValue={client.projectCount.toString()} type="number" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" defaultValue={client.contactEmail} type="email" />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="lastContact">Last Contact</Label>
              <Input id="lastContact" defaultValue={client.lastContact} type="date" />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input id="totalValue" defaultValue={client.totalValue.toString()} type="number" />
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
