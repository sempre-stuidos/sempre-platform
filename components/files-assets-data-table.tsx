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
  IconFile,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconBrandFigma,
  IconArchive,
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
import { FilesAssets } from "@/lib/types"
import { getFilePublicUrl, deleteFilesAssets } from "@/lib/files-assets"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

const getFileIcon = (format: string) => {
  const formatLower = format.toLowerCase()
  if (formatLower.includes('svg') || formatLower.includes('png') || formatLower.includes('jpg') || formatLower.includes('jpeg')) {
    return <IconPhoto className="size-4" />
  } else if (formatLower.includes('mp4') || formatLower.includes('mov') || formatLower.includes('avi')) {
    return <IconVideo className="size-4" />
  } else if (formatLower.includes('pdf') || formatLower.includes('doc') || formatLower.includes('txt')) {
    return <IconFileText className="size-4" />
  } else if (formatLower.includes('figma')) {
    return <IconBrandFigma className="size-4" />
  } else {
    return <IconFile className="size-4" />
  }
}

const columns: ColumnDef<FilesAssets>[] = [
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
    header: "File Name",
    cell: ({ row }) => {
      return <FileCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getFileIcon(row.original.format)}
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.category}
      </Badge>
    ),
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground max-w-32 truncate">
        {row.original.project}
      </div>
    ),
  },
  {
    accessorKey: "size",
    header: () => <div className="w-full text-center">Size</div>,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground text-center">
        {row.original.size}
      </div>
    ),
  },
  {
    accessorKey: "format",
    header: () => <div className="w-full text-center">Format</div>,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground text-center">
        {row.original.format}
      </div>
    ),
  },
  {
    accessorKey: "uploaded",
    header: () => <div className="w-full text-center">Uploaded</div>,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground text-center">
        {row.original.uploaded}
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
        "Review": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Draft": "bg-blue-100 text-blue-800 border-blue-200",
        "Processing": "bg-purple-100 text-purple-800 border-purple-200",
        "Archive": "bg-gray-100 text-gray-800 border-gray-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {status === "Active" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : status === "Processing" ? (
            <IconLoader className="mr-1" />
          ) : status === "Archive" ? (
            <IconArchive className="mr-1" />
          ) : null}
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const fileAsset = row.original
      
      const handleDownload = () => {
        if (fileAsset.file_url) {
          const publicUrl = getFilePublicUrl(fileAsset.file_url)
          window.open(publicUrl, '_blank')
        } else {
          toast.error("No file URL available for download")
        }
      }

      const handlePreview = () => {
        if (fileAsset.file_url) {
          const publicUrl = getFilePublicUrl(fileAsset.file_url)
          window.open(publicUrl, '_blank')
        } else {
          toast.error("No file URL available for preview")
        }
      }

      const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${fileAsset.name}"?`)) {
          const success = await deleteFilesAssets(fileAsset.id)
          if (success) {
            setData(data.filter(file => file.id !== fileAsset.id))
            toast.success("File deleted successfully")
            onDataChange?.()
          } else {
            toast.error("Failed to delete file")
          }
        }
      }

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
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={handleDownload} disabled={!fileAsset.file_url}>
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePreview} disabled={!fileAsset.file_url}>
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Move to Archive</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<FilesAssets> }) {
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

export function FilesAssetsDataTable({
  data: initialData,
  onUploadClick,
  onDataChange,
}: {
  data: FilesAssets[]
  onUploadClick?: () => void
  onDataChange?: () => void
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
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  const sortableId = React.useId()

  // Sync local data with prop when it changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
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

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedFiles = selectedRows.map(row => row.original)
    
    try {
      const deletePromises = selectedFiles.map(file => deleteFilesAssets(file.id))
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(Boolean).length
      if (successCount > 0) {
        const deletedIds = selectedFiles.slice(0, successCount).map(f => f.id)
        setData(data.filter(file => !deletedIds.includes(file.id)))
        toast.success(`${successCount} file(s) deleted successfully`)
        table.resetRowSelection()
        onDataChange?.()
      }
      
      if (successCount < selectedFiles.length) {
        toast.error(`Failed to delete ${selectedFiles.length - successCount} file(s)`)
      }
    } catch (error) {
      console.error("Error deleting files:", error)
      toast.error("Failed to delete files")
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  return (
    <Tabs
      defaultValue="all-files"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all-files">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-files">All Files</SelectItem>
            <SelectItem value="client-assets">Client Assets</SelectItem>
            <SelectItem value="project-assets">Project Assets</SelectItem>
            <SelectItem value="recent-uploads">Recent Uploads</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all-files">All Files</TabsTrigger>
          <TabsTrigger value="client-assets">
            Client Assets <Badge variant="secondary">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="project-assets">
            Project Assets <Badge variant="secondary">8</Badge>
          </TabsTrigger>
          <TabsTrigger value="recent-uploads">Recent Uploads</TabsTrigger>
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
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <IconPlus />
            <span className="hidden lg:inline">Upload File</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="all-files"
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
        value="client-assets"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="project-assets" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="recent-uploads"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>

      {/* Bulk Actions Bar */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} file(s) selected
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
            <AlertDialogTitle>Delete Multiple Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the following {table.getFilteredSelectedRowModel().rows.length} file(s)? This action cannot be undone.
              
              <div className="mt-3 max-h-32 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {table.getFilteredSelectedRowModel().rows.map((row) => (
                    <li key={row.original.id} className="flex justify-between">
                      <span>{row.original.name}</span>
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
              Delete {table.getFilteredSelectedRowModel().rows.length} File(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

function FileCellViewer({ item }: { item: FilesAssets }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            File details and management options
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">File Name</Label>
              <Input id="name" defaultValue={item.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Logo">Logo</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Mockup">Mockup</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Images">Images</SelectItem>
                    <SelectItem value="Wireframe">Wireframe</SelectItem>
                    <SelectItem value="Prototype">Prototype</SelectItem>
                    <SelectItem value="Template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={item.category}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client Assets">Client Assets</SelectItem>
                    <SelectItem value="Project Assets">Project Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="project">Project</Label>
                <Input id="project" defaultValue={item.project} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Archive">Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="size">Size</Label>
                <Input id="size" defaultValue={item.size} disabled />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="format">Format</Label>
                <Input id="format" defaultValue={item.format} disabled />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="uploaded">Uploaded</Label>
              <Input id="uploaded" defaultValue={item.uploaded} disabled />
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
