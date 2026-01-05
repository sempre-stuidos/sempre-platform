"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BlogEditor } from "@/components/blog-editor/blog-editor"
import { Blog } from "@/lib/blogs"
import { toast } from "sonner"
import { ImagePicker } from "@/components/image-picker"
import { Badge } from "@/components/ui/badge"
import { IconX } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface BlogFormProps {
  orgId: string
  blog?: Blog | null
  businessSlug?: string
}

export function BlogForm({ orgId, blog, businessSlug }: BlogFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    title: blog?.title || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    image_url: blog?.image_url || "",
    author: blog?.author || "",
    category: blog?.category || "",
    tags: blog?.tags || [],
    status: blog?.status || ("draft" as "draft" | "published" | "archived"),
    seo_title: blog?.seo_title || "",
    seo_description: blog?.seo_description || "",
  })

  const [tagInput, setTagInput] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" })
      return
    }

    if (!formData.content.trim()) {
      setErrors({ content: "Content is required" })
      return
    }

    setIsSubmitting(true)

    try {
      const url = blog
        ? `/api/blogs/${orgId}/${blog.id}`
        : `/api/blogs/${orgId}`
      const method = blog ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save blog")
      }

      await response.json()
      toast.success(blog ? "Blog updated successfully" : "Blog created successfully")
      router.push(`/client/${orgId}/retail/blogs`)
    } catch (error) {
      console.error("Error saving blog:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save blog"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <Tabs defaultValue="basic" className="flex flex-col w-full">
        <div className="sticky top-0 z-10 bg-background pb-4 border-b mb-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="settings">Settings & SEO</TabsTrigger>
          </TabsList>
        </div>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter blog title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              placeholder="Brief description of the blog post"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              A short summary that will appear in blog listings
            </p>
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <ImagePicker
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              label=""
              orgId={orgId}
              businessSlug={businessSlug}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>
              Content <span className="text-destructive">*</span>
            </Label>
            <BlogEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              placeholder="Author name"
            />
          </div>
        </TabsContent>

        {/* Settings & SEO Tab */}
        <TabsContent value="settings" className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="e.g., Hair Care, Ingredients, Sustainability"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "draft" | "published" | "archived") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SEO Title */}
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(e) =>
                setFormData({ ...formData, seo_title: e.target.value })
              }
              placeholder="Optional SEO title (defaults to blog title)"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the blog title
            </p>
          </div>

          {/* SEO Description */}
          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={formData.seo_description}
              onChange={(e) =>
                setFormData({ ...formData, seo_description: e.target.value })
              }
              placeholder="Optional SEO description for search engines"
              rows={2}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t justify-end mt-auto">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : blog
            ? "Update Blog"
            : "Create Blog"}
        </Button>
      </div>
    </form>
  )
}

