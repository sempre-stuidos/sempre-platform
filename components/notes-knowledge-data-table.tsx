"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLayoutGrid,
  IconNote,
  IconBook,
  IconPlus,
  IconBug,
  IconBulb,
  IconUsers,
  IconFileText,
  IconEdit,
  IconClipboardText,
  IconExternalLink,
  IconBrandNotion,
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
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { useIsMobile } from "@/hooks/use-mobile"
import { NotesKnowledge } from "@/lib/types"
import { createNotesKnowledge, updateNotesKnowledge, deleteNotesKnowledge } from "@/lib/notes-knowledge"
import { AddNoteModal } from "@/components/add-note-modal"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const createColumns = (onEditNote?: (note: NotesKnowledge) => void, onDeleteNote?: (note: NotesKnowledge) => void): ColumnDef<NotesKnowledge>[] => [
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
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      const getTypeIcon = (type: string) => {
        switch (type) {
          case "Proposal":
            return <IconClipboardText className="size-4 text-sky-600" />
          case "Internal Playbook":
            return <IconBook className="size-4 text-blue-600" />
          case "Meeting Notes":
            return <IconUsers className="size-4 text-green-600" />
          case "Research Notes":
            return <IconFileText className="size-4 text-purple-600" />
          case "Bug Report":
            return <IconBug className="size-4 text-red-600" />
          case "Feature Request":
            return <IconBulb className="size-4 text-orange-600" />
          case "Standup Notes":
            return <IconUsers className="size-4 text-cyan-600" />
          case "Documentation":
            return <IconFileText className="size-4 text-indigo-600" />
          case "notion":
            return <IconBrandNotion className="size-4 text-black dark:text-white" />
          default:
            return <IconNote className="size-4 text-gray-600" />
        }
      }
      return (
        <div className="flex items-center gap-2">
          {getTypeIcon(type)}
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {type}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusColors = {
        "Draft": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Published": "bg-green-100 text-green-800 border-green-200",
        "Archived": "bg-gray-100 text-gray-800 border-gray-200",
        "Template": "bg-blue-100 text-blue-800 border-blue-200",
        "Open": "bg-red-100 text-red-800 border-red-200",
        "Under Review": "bg-orange-100 text-orange-800 border-orange-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {status === "Published" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : null}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <div className="text-sm">
        {!row.original.clientName || row.original.clientName === "" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          row.original.clientName
        )}
      </div>
    ),
  },
  {
    accessorKey: "projectName",
    header: "Project",
    cell: ({ row }) => (
      <div className="text-sm">
        {!row.original.projectName || row.original.projectName === "" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          row.original.projectName
        )}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.date}
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => (
      <div className="text-sm">{row.original.author}</div>
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
          <DropdownMenuItem onClick={() => onEditNote?.(row.original)}>
            <IconEdit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteNote?.(row.original)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function NotesKnowledgeDataTable({
  data: initialData,
}: {
  data: NotesKnowledge[]
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
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table')
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = React.useState(false)
  const [editingNote, setEditingNote] = React.useState<NotesKnowledge | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [noteToDelete, setNoteToDelete] = React.useState<NotesKnowledge | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)

  const handleAddNote = async (noteData: Partial<NotesKnowledge>) => {
    try {
      console.log('handleAddNote called with:', noteData)
      const newNote = await createNotesKnowledge(noteData as Omit<NotesKnowledge, 'id' | 'created_at' | 'updated_at'>)
      if (newNote) {
        setData(prev => [...prev, newNote])
        toast.success('Note created successfully')
        setIsAddNoteModalOpen(false)
      } else {
        toast.error('Failed to create note. Check console for details.')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note'
      toast.error(`Failed to create note: ${errorMessage}`)
    }
  }

  const handleUpdateNote = async (noteData: Partial<NotesKnowledge>) => {
    if (!editingNote) return
    
    try {
      const updatedNote = await updateNotesKnowledge(editingNote.id, noteData)
      if (updatedNote) {
        setData(prev => prev.map(n => n.id === editingNote.id ? updatedNote : n))
        toast.success('Note updated successfully')
        setEditingNote(null)
        setIsAddNoteModalOpen(false)
      } else {
        toast.error('Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      const success = await deleteNotesKnowledge(noteId)
      if (success) {
        setData(data.filter(note => note.id !== noteId))
        toast.success('Note deleted successfully')
        setDeleteDialogOpen(false)
        setNoteToDelete(null)
      } else {
        toast.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const openDeleteDialog = (note: NotesKnowledge) => {
    setNoteToDelete(note)
    setDeleteDialogOpen(true)
  }

  const handleEditNote = (note: NotesKnowledge) => {
    setEditingNote(note)
    setIsAddNoteModalOpen(true)
  }

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedNotes = selectedRows.map(row => row.original)
    
    try {
      const deletePromises = selectedNotes.map(note => deleteNotesKnowledge(note.id))
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(Boolean).length
      if (successCount > 0) {
        const deletedIds = selectedNotes.slice(0, successCount).map(n => n.id)
        setData(data.filter(note => !deletedIds.includes(note.id)))
        toast.success(`${successCount} note(s) deleted successfully`)
        table.resetRowSelection()
      }
      
      if (successCount < selectedNotes.length) {
        toast.error(`Failed to delete ${selectedNotes.length - successCount} note(s)`)
      }
    } catch (error) {
      console.error("Error deleting notes:", error)
      toast.error("Failed to delete notes")
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  const columns = React.useMemo(() => createColumns(handleEditNote, openDeleteDialog), [])

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
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
            <SelectItem value="playbooks">Internal Playbooks</SelectItem>
            <SelectItem value="other">Other Notes</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="meeting-notes">
            Meeting Notes <Badge variant="secondary">6</Badge>
          </TabsTrigger>
          <TabsTrigger value="playbooks">
            Playbooks <Badge variant="secondary">6</Badge>
          </TabsTrigger>
          <TabsTrigger value="other">
            Other Notes <Badge variant="secondary">8</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <IconLayoutColumns className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-l-none border-l"
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
          <Button variant="outline" size="sm" onClick={() => setIsAddNoteModalOpen(true)}>
            <IconPlus />
            <span className="hidden lg:inline">Add Note</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {viewMode === 'table' ? (
          <div className="overflow-hidden rounded-lg border">
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
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <CardViewItem key={row.id} item={row.original} onEdit={handleEditNote} onDelete={openDeleteDialog} />
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
        value="meeting-notes"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="playbooks" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="other"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>

    {/* Add/Edit Note Modal */}
    <AddNoteModal
      isOpen={isAddNoteModalOpen}
      onClose={() => {
        setIsAddNoteModalOpen(false)
        setEditingNote(null)
      }}
      onAddNote={editingNote ? handleUpdateNote : handleAddNote}
      initialData={editingNote || undefined}
      isEdit={!!editingNote}
    />

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{noteToDelete?.title}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => noteToDelete && handleDeleteNote(noteToDelete.id)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Bulk Actions Bar */}
    {table.getFilteredSelectedRowModel().rows.length > 0 && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} note(s) selected
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

    {/* Bulk Delete Dialog */}
    <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Notes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the following {table.getFilteredSelectedRowModel().rows.length} note(s)? This action cannot be undone.
            
            <div className="mt-3 max-h-32 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {table.getFilteredSelectedRowModel().rows.map((row) => (
                  <li key={row.original.id} className="flex justify-between">
                    <span>{row.original.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBulkDelete}
          >
            Delete {table.getFilteredSelectedRowModel().rows.length} Note(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function CardViewItem({ item, onEdit, onDelete }: { item: NotesKnowledge; onEdit: (note: NotesKnowledge) => void; onDelete: (note: NotesKnowledge) => void }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isPlaybook = item.type === "Internal Playbook"
  const statusColors = {
    "Draft": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Published": "bg-green-100 text-green-800 border-green-200",
    "Archived": "bg-gray-100 text-gray-800 border-gray-200",
    "Template": "bg-blue-100 text-blue-800 border-blue-200",
    "Open": "bg-red-100 text-red-800 border-red-200",
    "Under Review": "bg-orange-100 text-orange-800 border-orange-200"
  }

  const handleItemClick = () => {
    if (item.type === "Proposal") {
      router.push(`/notes-knowledge/${item.id}`)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {(() => {
              switch (item.type as NotesKnowledge['type']) {
                case "Proposal":
                  return <IconClipboardText className="size-4 text-sky-600" />
                case "Internal Playbook":
                  return <IconBook className="size-4 text-blue-600" />
                case "Meeting Notes":
                  return <IconUsers className="size-4 text-green-600" />
                case "Research Notes":
                  return <IconFileText className="size-4 text-purple-600" />
                case "Bug Report":
                  return <IconBug className="size-4 text-red-600" />
                case "Feature Request":
                  return <IconBulb className="size-4 text-orange-600" />
                case "Standup Notes":
                  return <IconUsers className="size-4 text-cyan-600" />
                case "Documentation":
                  return <IconFileText className="size-4 text-indigo-600" />
                case "notion":
                  return <IconBrandNotion className="size-4 text-black dark:text-white" />
                default:
                  return <IconNote className="size-4 text-gray-600" />
              }
            })()}
            <Badge 
              variant="outline" 
              className={`px-1.5 text-xs ${statusColors[item.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
            >
              {item.status === "Published" ? (
                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 size-3" />
              ) : null}
              {item.status}
            </Badge>
          </div>
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
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <IconEdit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-base leading-tight">
          {item.type === "Proposal" ? (
            <Button 
              variant="link" 
              className="text-foreground w-fit px-0 text-left h-auto p-0 font-semibold hover:text-sky-600"
              onClick={handleItemClick}
            >
              <div className="flex items-center gap-2">
                {item.title}
                <IconExternalLink className="h-3 w-3 opacity-60" />
              </div>
            </Button>
          ) : item.type === "notion" && item.notion_url ? (
            <Button 
              variant="link" 
              className="text-foreground w-fit px-0 text-left h-auto p-0 font-semibold hover:text-blue-600"
              onClick={handleNotionClick}
            >
              <div className="flex items-center gap-2">
                {item.title}
                <IconExternalLink className="h-3 w-3 opacity-60" />
              </div>
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-foreground w-fit px-0 text-left h-auto p-0 font-semibold">
                  {item.title}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    switch (item.type as NotesKnowledge['type']) {
                      case "Proposal":
                        return <IconClipboardText className="size-5 text-sky-600" />
                      case "Internal Playbook":
                        return <IconBook className="size-5 text-blue-600" />
                      case "Meeting Notes":
                        return <IconUsers className="size-5 text-green-600" />
                      case "Research Notes":
                        return <IconFileText className="size-5 text-purple-600" />
                      case "Bug Report":
                        return <IconBug className="size-5 text-red-600" />
                      case "Feature Request":
                        return <IconBulb className="size-5 text-orange-600" />
                      case "Standup Notes":
                        return <IconUsers className="size-5 text-cyan-600" />
                      case "Documentation":
                        return <IconFileText className="size-5 text-indigo-600" />
                      default:
                        return <IconNote className="size-5 text-gray-600" />
                    }
                  })()}
                  {item.title}
                </DialogTitle>
                <DialogDescription>
                  {item.type} • {item.status} • Created by {item.author} on {item.date}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <p className="mt-1">{item.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={`px-2 py-1 text-xs ${statusColors[item.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Client:</span>
                    <p className="mt-1">{item.clientName || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Project:</span>
                    <p className="mt-1">{item.projectName || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Author:</span>
                    <p className="mt-1">{item.author}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Date:</span>
                    <p className="mt-1">{item.date}</p>
                  </div>
                </div>
                {item.content && (
                  <div className="pt-4 border-t">
                    <span className="font-medium text-muted-foreground">Content:</span>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
                {item.type === "notion" && item.notion_url && (
                  <div className="pt-4 border-t">
                    <span className="font-medium text-muted-foreground">Notion URL:</span>
                    <div className="mt-2">
                      <a 
                        href={item.notion_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                      >
                        {item.notion_url}
                        <IconExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Click the edit button in the dropdown menu to modify this note.
                  </p>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {item.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Client:</span>
            <span>{item.clientName || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Project:</span>
            <span>{item.projectName || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Author:</span>
            <span>{item.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Date:</span>
            <span>{item.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TableCellViewer({ item }: { item: NotesKnowledge }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const statusColors = {
    "Draft": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Published": "bg-green-100 text-green-800 border-green-200",
    "Archived": "bg-gray-100 text-gray-800 border-gray-200",
    "Template": "bg-blue-100 text-blue-800 border-blue-200",
    "Open": "bg-red-100 text-red-800 border-red-200",
    "Under Review": "bg-orange-100 text-orange-800 border-orange-200"
  }

  const handleItemClick = () => {
    if (item.type === "Proposal") {
      router.push(`/notes-knowledge/${item.id}`)
    }
  }

  const handleNotionClick = () => {
    if (item.type === "notion" && item.notion_url) {
      window.open(item.notion_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (item.type === "Proposal") {
    return (
      <Button 
        variant="link" 
        className="text-foreground w-fit px-0 text-left hover:text-sky-600"
        onClick={handleItemClick}
      >
        <div className="flex items-center gap-2">
          {item.title}
          <IconExternalLink className="h-3 w-3 opacity-60" />
        </div>
      </Button>
    )
  }

  if (item.type === "notion" && item.notion_url) {
    return (
      <Button 
        variant="link" 
        className="text-foreground w-fit px-0 text-left hover:text-blue-600"
        onClick={handleNotionClick}
      >
        <div className="flex items-center gap-2">
          {item.title}
          <IconExternalLink className="h-3 w-3 opacity-60" />
        </div>
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(() => {
              switch (item.type as NotesKnowledge['type']) {
                case "Proposal":
                  return <IconClipboardText className="size-5 text-sky-600" />
                case "Internal Playbook":
                  return <IconBook className="size-5 text-blue-600" />
                case "Meeting Notes":
                  return <IconUsers className="size-5 text-green-600" />
                case "Research Notes":
                  return <IconFileText className="size-5 text-purple-600" />
                case "Bug Report":
                  return <IconBug className="size-5 text-red-600" />
                case "Feature Request":
                  return <IconBulb className="size-5 text-orange-600" />
                case "Standup Notes":
                  return <IconUsers className="size-5 text-cyan-600" />
                case "Documentation":
                  return <IconFileText className="size-5 text-indigo-600" />
                case "notion":
                  return <IconBrandNotion className="size-5 text-black dark:text-white" />
                default:
                  return <IconNote className="size-5 text-gray-600" />
              }
            })()}
            {item.title}
          </DialogTitle>
          <DialogDescription>
            {item.type} • {item.status} • Created by {item.author} on {item.date}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Type:</span>
              <p className="mt-1">{item.type}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status:</span>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className={`px-2 py-1 text-xs ${statusColors[item.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Client:</span>
              <p className="mt-1">{item.clientName || "-"}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Project:</span>
              <p className="mt-1">{item.projectName || "-"}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Author:</span>
              <p className="mt-1">{item.author}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date:</span>
              <p className="mt-1">{item.date}</p>
            </div>
          </div>
          {item.content && (
            <div className="pt-4 border-t">
              <span className="font-medium text-muted-foreground">Content:</span>
              <p className="mt-2 text-sm whitespace-pre-wrap">{item.content}</p>
            </div>
          )}
          {item.type === "notion" && item.notion_url && (
            <div className="pt-4 border-t">
              <span className="font-medium text-muted-foreground">Notion URL:</span>
              <div className="mt-2">
                <a 
                  href={item.notion_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  {item.notion_url}
                  <IconExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Click the edit button in the dropdown menu to modify this note.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
