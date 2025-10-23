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

import { updateTask, deleteTask } from "@/lib/tasks"
import { Task } from "@/lib/types"
import { AddTaskModal } from "@/components/add-task-modal"
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

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string(),
  deliverable: z.string(),
  priority: z.string(),
  dueDate: z.string(),
})

// Helper function to convert status formats
function convertStatusToTaskFormat(status: string): 'To Do' | 'In Progress' | 'Review' | 'Done' {
  const statusMap: Record<string, 'To Do' | 'In Progress' | 'Review' | 'Done'> = {
    'pending': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'completed': 'Done',
    'done': 'Done',
  }
  return statusMap[status.toLowerCase()] || 'To Do'
}

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

const columns: ColumnDef<z.infer<typeof taskSchema>>[] = [
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
    header: "Task Title",
    cell: ({ row }) => {
      return (
        <div className="text-sm font-medium">
          {row.original.title}
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusColors = {
        "completed": "bg-green-100 text-green-800 border-green-200",
        "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
        "pending": "bg-gray-100 text-gray-800 border-gray-200"
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}`}
        >
          {status === "completed" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : status === "in-progress" ? (
            <IconLoader className="mr-1" />
          ) : (
            <IconClock className="mr-1" />
          )}
          {status.replace('-', ' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: "deliverable",
    header: "Deliverable",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.deliverable}
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.original.priority
      const priorityColors = {
        "High": "bg-red-100 text-red-800 border-red-200",
        "Medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Low": "bg-green-100 text-green-800 border-green-200"
      }
      return (
        <Badge variant="outline" className={priorityColors[priority as keyof typeof priorityColors]}>
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const date = new Date(row.original.dueDate)
      return (
        <div className="text-sm flex items-center gap-1">
          <IconCalendar className="h-3 w-3" />
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const task = row.original
      const { handleEditTask, handleMarkComplete, handleDuplicate, handleDelete } = table.options.meta as any
      
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
            <DropdownMenuItem onClick={() => handleEditTask(task)}>
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMarkComplete(task.id)}>
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(task)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(task.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof taskSchema>> }) {
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

export function ProjectTasksTable({
  data: initialData,
  onAddTask,
  onTaskUpdate,
}: {
  data: z.infer<typeof taskSchema>[]
  onAddTask?: () => void
  onTaskUpdate?: () => void
}) {
  const [data, setData] = React.useState(() => initialData)
  const [editingTask, setEditingTask] = React.useState<z.infer<typeof taskSchema> | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
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

  // Update local data when initialData changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Handler functions - defined before useReactTable
  const handleEditTask = (task: z.infer<typeof taskSchema>) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (taskData: any) => {
    if (!editingTask) return

    try {
      await updateTask(editingTask.id, {
        title: taskData.title,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
      })
      toast.success('Task updated successfully!')
      setIsEditModalOpen(false)
      setEditingTask(null)
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleMarkComplete = async (taskId: number) => {
    try {
      await updateTask(taskId, { status: 'Done' as any })
      toast.success('Task marked as complete!')
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error marking task complete:', error)
      toast.error('Failed to mark task as complete')
    }
  }

  const handleDuplicate = async (task: z.infer<typeof taskSchema>) => {
    try {
      // Note: You'll need to implement createTask in tasks.ts if not already available
      toast.info('Duplicate functionality coming soon!')
    } catch (error) {
      console.error('Error duplicating task:', error)
      toast.error('Failed to duplicate task')
    }
  }

  const handleDelete = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }
    
    try {
      await deleteTask(taskId)
      toast.success('Task deleted successfully!')
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
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
      handleEditTask,
      handleMarkComplete,
      handleDuplicate,
      handleDelete,
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

  return (
    <div className="w-full flex flex-col justify-start gap-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <IconPlus />
            <span className="hidden lg:inline">Add Task</span>
          </Button>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto">
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
      
      {/* Edit Task Modal */}
      {editingTask && (
        <AddTaskModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTask(null)
          }}
          onAddTask={handleSaveEdit}
          initialData={{
            id: editingTask.id,
            title: editingTask.title,
            projectId: 0, // This will be set from the form
            assigneeId: null,
            status: convertStatusToTaskFormat(editingTask.status),
            priority: editingTask.priority as 'High' | 'Medium' | 'Low',
            dueDate: editingTask.dueDate,
            progress: 0,
            projectName: undefined,
            assigneeName: undefined,
            assigneeRole: undefined,
            assigneeAvatar: undefined,
            created_at: '',
            updated_at: '',
          }}
          isEdit={true}
        />
      )}
    </div>
  )
}
