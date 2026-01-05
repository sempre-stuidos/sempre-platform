"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface BlogEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function BlogEditor({
  value,
  onChange,
  placeholder = "Write your blog content here...",
  className,
  label,
}: BlogEditorProps) {
  // Always show textarea for now - TipTap can be added later if needed
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={15}
        className="min-h-[300px] font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        You can write HTML directly in this editor. For rich text editing, install TipTap packages.
      </p>
    </div>
  )
}

