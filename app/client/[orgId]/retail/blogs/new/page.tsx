"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { BlogForm } from "@/components/blog-form/blog-form"
import { useBusinessContext } from "@/hooks/use-business-context"

export default function NewBlogPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const { business } = useBusinessContext()

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Create New Blog Post</h1>
            <p className="text-muted-foreground">
              Write and publish a new blog post for your business
            </p>
          </div>
          <BlogForm orgId={orgId} businessSlug={business?.slug} />
        </div>
      </div>
    </div>
  )
}

