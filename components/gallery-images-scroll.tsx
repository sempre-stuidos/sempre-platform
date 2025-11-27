"use client"

import { IconFolder, IconDotsVertical, IconPlus, IconBrandGoogleDrive } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilesAssets } from "@/lib/types"
import { getFilePublicUrl } from "@/lib/files-assets"
import { toast } from "sonner"

interface GalleryImagesScrollProps {
  data: FilesAssets[]
  onUploadClick?: () => void
  onGoogleDriveImportClick?: () => void
}

export function GalleryImagesScroll({ data, onUploadClick, onGoogleDriveImportClick }: GalleryImagesScrollProps) {
  const handleDownload = (file: FilesAssets) => {
    if (file.file_url) {
      const publicUrl = getFilePublicUrl(file.file_url)
      window.open(publicUrl, '_blank')
    } else {
      toast.error("No file URL available for download")
    }
  }

  const handlePreview = (file: FilesAssets) => {
    if (file.file_url) {
      const publicUrl = getFilePublicUrl(file.file_url)
      window.open(publicUrl, '_blank')
    } else {
      toast.error("No file URL available for preview")
    }
  }

  const handleDelete = () => {
    toast.info("Delete functionality (demo mode)")
  }

  const handleRename = () => {
    toast.info("Rename functionality (demo mode)")
  }

  return (
    <div className="px-4 lg:px-6 mb-6">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          {onGoogleDriveImportClick && (
            <Button variant="outline" size="sm" onClick={onGoogleDriveImportClick}>
              <IconBrandGoogleDrive className="size-4" />
              <span className="hidden lg:inline">Import from Drive</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <IconPlus className="size-4" />
            <span className="hidden lg:inline">Upload File</span>
          </Button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-4 px-4 lg:-mx-6 lg:px-6">
        {data.map((file) => (
          <div
            key={file.id}
            className="group relative flex-[0_0_calc(25%-0.75rem)] h-36 bg-card border rounded-lg shadow-sm p-4 flex flex-col items-center justify-between hover:bg-accent hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="flex-1 flex items-center justify-center w-full">
              <IconFolder className="size-12 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="w-full text-center min-h-[2.5rem] flex items-end justify-center">
              <p className="text-xs font-medium truncate w-full" title={file.name}>
                {file.name}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handlePreview(file)} disabled={!file.file_url}>
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file)} disabled={!file.file_url}>
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRename}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}

