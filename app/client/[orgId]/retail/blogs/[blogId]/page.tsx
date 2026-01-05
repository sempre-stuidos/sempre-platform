"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { BlogForm } from "@/components/blog-form/blog-form"
import { Blog } from "@/lib/blogs"
import { useBusinessContext } from "@/hooks/use-business-context"

export default function EditBlogPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const blogId = params.blogId as string
  const { business } = useBusinessContext()

  const [blog, setBlog] = React.useState<Blog | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/blogs/${orgId}/${blogId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setBlog(null)
            return
          }
          throw new Error("Failed to fetch blog")
        }

        const data = await response.json()
        setBlog(data.blog)
      } catch (error) {
        console.error("Error fetching blog:", error)
        setBlog(null)
      } finally {
        setLoading(false)
      }
    }

    if (orgId && blogId) {
      fetchBlog()
    }
  }, [orgId, blogId])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading blog...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Blog Not Found</h2>
              <p className="text-muted-foreground">
                The blog post you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have access to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Edit Blog Post</h1>
            <p className="text-muted-foreground">
              Update your blog post content and settings
            </p>
          </div>
          <BlogForm orgId={orgId} blog={blog} businessSlug={business?.slug} />
        </div>
      </div>
    </div>
  )
}

