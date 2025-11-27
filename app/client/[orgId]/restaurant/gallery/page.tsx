"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GalleryImagesGrid } from "@/components/gallery-images-grid"
import { UploadImageModal } from "@/components/upload-image-modal"
import { GoogleDriveImportModal } from "@/components/google-drive-import-modal"
import { FilesAssets } from "@/lib/types"
import { getGalleryImagesForBusiness } from "@/lib/files-assets"
import { getBusinessById } from "@/lib/businesses"
import { toast } from "sonner"

// Calculate stats from data
const calculateStats = (data: FilesAssets[]) => {
  const totalFiles = data.length
  const filesThisWeek = data.filter(file => {
    const uploadDate = new Date(file.uploaded)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return uploadDate >= weekAgo
  }).length
  
  const today = new Date().toISOString().split('T')[0]
  const uploadsToday = data.filter(file => file.uploaded === today).length

  // Calculate storage from file sizes (convert MB to bytes)
  const storageUsedBytes = data.reduce((total, file) => {
    const sizeMatch = file.size.match(/([\d.]+)\s*MB/i)
    if (sizeMatch) {
      return total + parseFloat(sizeMatch[1]) * 1024 * 1024
    }
    return total
  }, 0)
  
  const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024)
  const storageLimit = 5
  const storagePercentage = (storageUsedGB / storageLimit) * 100

  return {
    totalFiles,
    filesThisWeek,
    uploadsToday,
    totalProjects: 0,
    storageUsedBytes,
    storageUsedGB,
    storagePercentage,
    storageLimit,
  }
}

export default function GalleryPage() {
  const params = useParams()
  const orgId = params.orgId as string
  
  const [data, setData] = useState<FilesAssets[]>([])
  const [stats, setStats] = useState({
    totalFiles: 0,
    filesThisWeek: 0,
    uploadsToday: 0,
    totalProjects: 0,
    storageUsedBytes: 0,
    storageUsedGB: 0,
    storagePercentage: 0,
    storageLimit: 5,
  })
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isGoogleDriveImportModalOpen, setIsGoogleDriveImportModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch gallery images from database
  useEffect(() => {
    const fetchGalleryImages = async () => {
      setIsLoading(true)
      try {
        // Get business to retrieve slug
        const business = await getBusinessById(orgId)
        if (!business) {
          toast.error("Business not found")
          setData([])
          setStats(calculateStats([]))
          setIsLoading(false)
          return
        }

        // Fetch gallery images for this business
        const galleryImages = await getGalleryImagesForBusiness(business.slug || undefined)
        setData(galleryImages)
        setStats(calculateStats(galleryImages))
      } catch (error) {
        console.error("Error fetching gallery images:", error)
        toast.error("Failed to load gallery images")
        setData([])
        setStats(calculateStats([]))
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchGalleryImages()
    }
  }, [orgId])

  const handleUploadSuccess = async () => {
    // Refresh data after successful upload
    try {
      const business = await getBusinessById(orgId)
      if (business) {
        const galleryImages = await getGalleryImagesForBusiness(business.slug || undefined)
        setData(galleryImages)
        setStats(calculateStats(galleryImages))
      }
    } catch (error) {
      console.error("Error refreshing gallery images:", error)
    }
  }

  const handleGoogleDriveImportSuccess = () => {
    toast.success("Google Drive import initiated")
    // Refresh data after import
    handleUploadSuccess()
  }

  const handleDataChange = async () => {
    // Refresh data
    await handleUploadSuccess()
  }

  const handleFolderClick = (folder: string) => {
    // Navigate to folder details or filter
    toast.info(`Viewing folder: ${folder}`)
    // In a real implementation, you could navigate to a folder detail page
    // router.push(`/client/${orgId}/restaurant/gallery/folder/${encodeURIComponent(folder)}`)
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : (
          <GalleryImagesGrid 
            data={data} 
            onUploadClick={() => setIsUploadModalOpen(true)}
            onGoogleDriveImportClick={() => setIsGoogleDriveImportModalOpen(true)}
            onFolderClick={handleFolderClick}
            onDataChange={handleDataChange}
          />
        )}
      </div>

      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        orgId={orgId}
      />
      
      <GoogleDriveImportModal
        isOpen={isGoogleDriveImportModalOpen}
        onClose={() => setIsGoogleDriveImportModalOpen(false)}
        onImportSuccess={handleGoogleDriveImportSuccess}
      />
    </div>
  )
}

