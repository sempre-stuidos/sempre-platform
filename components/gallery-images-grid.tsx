"use client"

import { useState, useMemo } from "react"
import { IconDotsVertical, IconPlus, IconBrandGoogleDrive, IconChevronLeft, IconChevronRight, IconFolder, IconEye, IconDownload, IconEdit, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FilesAssets } from "@/lib/types"
import { getFilePublicUrl } from "@/lib/files-assets"
import { toast } from "sonner"
import Image from "next/image"

interface GalleryImagesGridProps {
  data: FilesAssets[]
  onUploadClick?: () => void
  onGoogleDriveImportClick?: () => void
  onFolderClick?: (folder: string) => void
}

const ITEMS_PER_PAGE = 6
const IMAGES_PER_ROW = 3
const RECENTS_FOLDER = "Recents"

export function GalleryImagesGrid({ data, onUploadClick, onGoogleDriveImportClick, onFolderClick }: GalleryImagesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFolder, setSelectedFolder] = useState<string>(RECENTS_FOLDER)

  // Extract unique folders from data (using project field, or create folders)
  const folders = useMemo(() => {
    const folderSet = new Set<string>()
    folderSet.add(RECENTS_FOLDER)
    
    // Extract folders from project field or create default folders
    data.forEach(file => {
      if (file.project && file.project.trim()) {
        folderSet.add(file.project)
      }
    })
    
    // Add some default folders if no projects exist
    if (folderSet.size === 1) {
      folderSet.add("All Images")
      folderSet.add("Favorites")
    }
    
    return Array.from(folderSet).sort()
  }, [data])

  // Filter data based on selected folder
  const filteredData = useMemo(() => {
    if (selectedFolder === RECENTS_FOLDER) {
      // Show most recently uploaded images
      return [...data].sort((a, b) => {
        const dateA = new Date(a.uploaded).getTime()
        const dateB = new Date(b.uploaded).getTime()
        return dateB - dateA
      })
    } else if (selectedFolder === "All Images") {
      return data
    } else {
      // Filter by project/folder
      return data.filter(file => file.project === selectedFolder)
    }
  }, [data, selectedFolder])

  // Reset to page 1 when folder changes
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder)
    setCurrentPage(1)
    if (onFolderClick) {
      onFolderClick(folder)
    }
  }
  
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPageData = filteredData.slice(startIndex, endIndex)

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

  const getImageUrl = (file: FilesAssets): string | null => {
    if (file.file_url) {
      return getFilePublicUrl(file.file_url)
    }
    if (file.google_drive_web_view_link) {
      return file.google_drive_web_view_link
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with folder filter and action buttons */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Select value={selectedFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="w-[180px]">
              <IconFolder className="size-4 mr-2" />
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {onGoogleDriveImportClick && (
            <Button variant="outline" size="sm" onClick={onGoogleDriveImportClick}>
              <IconBrandGoogleDrive className="size-4" />
              <span className="hidden lg:inline">Import from Drive</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <IconPlus className="size-4" />
            <span className="hidden lg:inline">Upload Image</span>
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {currentPageData.length === 0 ? (
        <div className="flex items-center justify-center py-12 px-4">
          <p className="text-muted-foreground">No images found</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPageData.map((file) => {
              const imageUrl = getImageUrl(file)
              
              return (
                <div
                  key={file.id}
                  className="group relative aspect-square bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <div className="relative w-full h-full">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={file.name}
                        fill
                        className="object-cover"
                        unoptimized={imageUrl.includes('google') || imageUrl.includes('drive')}
                        onError={() => {
                          // Image failed to load, will show fallback
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="text-center p-4">
                          <p className="text-sm text-muted-foreground mb-2">No Preview</p>
                          <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <p className="text-white text-sm font-medium px-4 text-center truncate w-full">
                        {file.name}
                      </p>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-background/90 backdrop-blur-sm shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 p-1.5">
                      <DropdownMenuItem 
                        onClick={() => handlePreview(file)} 
                        disabled={!imageUrl}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconEye className="size-4 text-muted-foreground" />
                        <span>Preview</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDownload(file)} 
                        disabled={!imageUrl}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconDownload className="size-4 text-muted-foreground" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleRename}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconEdit className="size-4 text-muted-foreground" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem 
                        variant="destructive" 
                        onClick={handleDelete}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconTrash className="size-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Image name at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-white/80 text-xs truncate">
                      {file.size} • {file.format}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} images
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                
                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return null
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

