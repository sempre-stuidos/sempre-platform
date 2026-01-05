"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Blog } from "@/lib/blogs"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BlogManagementProps {
  blogs: Blog[]
  orgId: string
  onBlogUpdated?: (blog: Blog) => void
  onBlogDeleted?: (blogId: string) => void
}

export function BlogManagement({
  blogs: initialBlogs,
  orgId,
  onBlogUpdated,
  onBlogDeleted,
}: BlogManagementProps) {
  const router = useRouter()
  const [blogs, setBlogs] = React.useState<Blog[]>(initialBlogs)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [blogToDelete, setBlogToDelete] = React.useState<Blog | null>(null)

  // Filter blogs based on search and status
  const filteredBlogs = React.useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        searchQuery === "" ||
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || blog.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [blogs, searchQuery, statusFilter])

  const handleDelete = async (blog: Blog) => {
    try {
      const response = await fetch(`/api/blogs/${orgId}/${blog.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete blog")
      }

      setBlogs((prev) => prev.filter((b) => b.id !== blog.id))
      onBlogDeleted?.(blog.id)
      toast.success("Blog deleted successfully")
    } catch (error) {
      console.error("Error deleting blog:", error)
      toast.error("Failed to delete blog")
    } finally {
      setDeleteDialogOpen(false)
      setBlogToDelete(null)
    }
  }

  const handleToggleStatus = async (blog: Blog, newStatus: "draft" | "published" | "archived") => {
    try {
      const response = await fetch(`/api/blogs/${orgId}/${blog.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update blog status")
      }

      const { blog: updatedBlog } = await response.json()
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? updatedBlog : b))
      )
      onBlogUpdated?.(updatedBlog)
      toast.success(`Blog ${newStatus === "published" ? "published" : newStatus === "draft" ? "saved as draft" : "archived"}`)
    } catch (error) {
      console.error("Error updating blog status:", error)
      toast.error("Failed to update blog status")
    }
  }

  const getStatusBadge = (status: Blog["status"]) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {blogs.length === 0
                    ? "No blogs yet. Create your first blog post!"
                    : "No blogs match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredBlogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{blog.title}</div>
                      {blog.excerpt && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {blog.excerpt.length > 20 ? `${blog.excerpt.substring(0, 20)}...` : blog.excerpt}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {blog.category ? (
                      <Badge variant="outline">{blog.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(blog.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(blog.published_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(blog.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/client/${orgId}/retail/blogs/${blog.id}`)
                          }
                        >
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {blog.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(blog, "published")}
                          >
                            <IconEye className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {blog.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(blog, "draft")}
                          >
                            <IconEyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setBlogToDelete(blog)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blogToDelete && handleDelete(blogToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

