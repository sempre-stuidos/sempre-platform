"use client"

import { useState, useMemo, useEffect } from "react"
import { IconDotsVertical, IconPlus, IconBrandGoogleDrive, IconChevronLeft, IconChevronRight, IconFolder, IconEye, IconDownload, IconEdit, IconTrash, IconWand } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilesAssets } from "@/lib/types"
import { getFilePublicUrl, deleteFilesAssets, updateFilesAssets } from "@/lib/files-assets"
import { getGalleryImagePublicUrl, deleteGalleryImage } from "@/lib/gallery-images"
import { toast } from "sonner"
import Image from "next/image"
import { ImageGenerationWizard } from "@/components/image-generation-wizard/image-generation-wizard"

interface GalleryImagesGridProps {
  data: FilesAssets[]
  onUploadClick?: () => void
  onGoogleDriveImportClick?: () => void
  onFolderClick?: (folder: string) => void
  onDataChange?: () => void
  businessType?: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other'
  orgId?: string
}

const ITEMS_PER_PAGE = 6
const RECENTS_FOLDER = "Recents"

export function GalleryImagesGrid({ data, onUploadClick, onGoogleDriveImportClick, onFolderClick, onDataChange, businessType, orgId }: GalleryImagesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFolder, setSelectedFolder] = useState<string>(RECENTS_FOLDER)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<FilesAssets | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [productsWithImages, setProductsWithImages] = useState<Array<{ id: string; name: string; imageCount: number }>>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isGenerateWizardOpen, setIsGenerateWizardOpen] = useState(false)

  // Fetch products with images for retail businesses
  useEffect(() => {
    if (businessType === 'retail' && orgId) {
      setIsLoadingProducts(true)
      fetch(`/api/products/${orgId}`)
        .then((res) => res.json())
        .then((responseData: { products?: Array<{ id: string; name: string }> }) => {
          if (responseData.products) {
            // Count images per product from current gallery images data
            const productCounts = new Map<string, number>()
            data.forEach((file) => {
              if (file.product_id) {
                productCounts.set(file.product_id, (productCounts.get(file.product_id) || 0) + 1)
              }
            })
            
            // Create products with images array - only include products that have images
            const productsWithCounts = responseData.products
              .filter((product) => {
                return productCounts.has(product.id)
              })
              .map((product) => {
                return {
                  id: product.id,
                  name: product.name,
                  imageCount: productCounts.get(product.id) || 0,
                }
              })
            
            setProductsWithImages(productsWithCounts)
          } else {
            setProductsWithImages([])
          }
        })
        .catch((error) => {
          console.error("Error fetching products:", error)
          setProductsWithImages([])
        })
        .finally(() => {
          setIsLoadingProducts(false)
        })
    } else {
      setProductsWithImages([])
    }
  }, [businessType, orgId, data])

  // Extract unique folders from data (using project field, or create folders)
  const folders = useMemo(() => {
    const folderSet = new Set<string>()
    folderSet.add(RECENTS_FOLDER)
    
    // For restaurant businesses, add Events and Menu folders
    if (businessType === 'restaurant') {
      folderSet.add("Events")
      folderSet.add("Menu")
      folderSet.add("All Images")
    } else if (businessType === 'retail') {
      // For retail businesses, add product folders
      folderSet.add("All Images")
      // Product folders will be added separately in the UI
    } else {
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
    }
    
    return Array.from(folderSet).sort()
  }, [data, businessType])

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
    } else if (selectedFolder === "Events") {
      // Filter by image_category for Events folder
      return data.filter(file => file.image_category === 'Event')
    } else if (selectedFolder === "Menu") {
      // Filter by image_category for Menu folder
      return data.filter(file => file.image_category === 'Menu')
    } else if (businessType === 'retail' && productsWithImages.some(p => p.id === selectedFolder)) {
      // Filter by product_id for retail product folders
      return data.filter(file => file.product_id === selectedFolder)
    } else {
      // Filter by project/folder (for non-restaurant businesses)
      return data.filter(file => file.project === selectedFolder)
    }
  }, [data, selectedFolder, businessType, productsWithImages])

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

  const getFileUrl = (file: FilesAssets): string | null => {
    if (file.file_url) {
      // Check if it's a gallery image
      if (file.file_url.includes('/gallery/') || file.project === 'Gallery') {
        return getGalleryImagePublicUrl(file.file_url)
      }
      return getFilePublicUrl(file.file_url)
    }
    if (file.google_drive_web_view_link) {
      return file.google_drive_web_view_link
    }
    return null
  }

  const handleDownload = (file: FilesAssets) => {
    const url = getFileUrl(file)
    if (url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Download started")
    } else {
      toast.error("No file URL available for download")
    }
  }

  const handlePreview = (file: FilesAssets) => {
    const url = getFileUrl(file)
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.error("No file URL available for preview")
    }
  }

  const handleDelete = async (file: FilesAssets) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      // Delete from storage if it's a gallery image
      if (file.file_url && (file.file_url.includes('/gallery/') || file.project === 'Gallery')) {
        await deleteGalleryImage(file.file_url)
      }

      // Delete from database
      const success = await deleteFilesAssets(file.id)
      
      if (success) {
        toast.success("Image deleted successfully")
        onDataChange?.()
      } else {
        toast.error("Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRename = (file: FilesAssets) => {
    setFileToRename(file)
    setNewFileName(file.name)
    setRenameDialogOpen(true)
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fileToRename || !newFileName.trim()) {
      toast.error("Please enter a valid file name")
      return
    }

    setIsRenaming(true)
    try {
      const success = await updateFilesAssets(fileToRename.id, {
        name: newFileName.trim()
      })

      if (success) {
        toast.success("Image renamed successfully")
        setRenameDialogOpen(false)
        setFileToRename(null)
        setNewFileName("")
        onDataChange?.()
      } else {
        toast.error("Failed to rename image")
      }
    } catch (error) {
      console.error("Error renaming image:", error)
      toast.error("Failed to rename image")
    } finally {
      setIsRenaming(false)
    }
  }

  const getImageUrl = (file: FilesAssets): string | null => {
    return getFileUrl(file)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with folder buttons and action buttons */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        {/* First row: Regular folders and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Folder buttons - show for restaurant and retail businesses */}
            {(businessType === 'restaurant' || businessType === 'retail') && folders.length > 0 && (
              <>
                {folders.map((folder) => (
                  <Button
                    key={folder}
                    variant={selectedFolder === folder ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFolderChange(folder)}
                    className="flex items-center gap-2"
                  >
                    <IconFolder className="size-4" />
                    {folder}
                  </Button>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateWizardOpen(true)}>
              <IconWand className="size-4" />
              <span className="hidden lg:inline">Generate Image</span>
            </Button>
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
        {/* Second row: Product folders for retail businesses */}
        {businessType === 'retail' && productsWithImages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {productsWithImages.map((product) => (
              <Button
                key={product.id}
                variant={selectedFolder === product.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleFolderChange(product.id)}
                className="flex items-center gap-2"
              >
                <IconFolder className="size-4" />
                {product.name} ({product.imageCount})
              </Button>
            ))}
          </div>
        )}
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
                        onClick={() => handleRename(file)}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconEdit className="size-4 text-muted-foreground" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem 
                        variant="destructive" 
                        onClick={() => handleDelete(file)}
                        disabled={isDeleting}
                        className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <IconTrash className="size-4" />
                        <span>{isDeleting ? "Deleting..." : "Delete"}</span>
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

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Image</DialogTitle>
            <DialogDescription>
              Enter a new name for the image file.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newFileName">File Name</Label>
              <Input
                id="newFileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new file name"
                disabled={isRenaming}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRenameDialogOpen(false)
                  setFileToRename(null)
                  setNewFileName("")
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming || !newFileName.trim()}>
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Generation Wizard */}
      {orgId && (
        <ImageGenerationWizard
          open={isGenerateWizardOpen}
          onOpenChange={setIsGenerateWizardOpen}
          orgId={orgId}
          businessType={businessType}
          galleryImages={data}
          onImageGenerated={() => {
            onDataChange?.()
          }}
        />
      )}
    </div>
  )
}

