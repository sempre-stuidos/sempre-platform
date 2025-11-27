"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ClientImagesTable } from "@/components/client-images-table"
import { GalleryImagesScroll } from "@/components/gallery-images-scroll"
import { UploadFileModal } from "@/components/upload-file-modal"
import { GoogleDriveImportModal } from "@/components/google-drive-import-modal"
import { FilesAssets } from "@/lib/types"
import { toast } from "sonner"

// Dummy data for restaurant/retail gallery images
const createDummyGalleryData = (): FilesAssets[] => {
  const today = new Date()
  const getDateString = (daysAgo: number) => {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }

  const restaurantImages = [
    { name: "Dining Room Interior", size: "2.5 MB", format: "JPG", daysAgo: 2, status: "Active" as const },
    { name: "Signature Dish Photo", size: "3.2 MB", format: "PNG", daysAgo: 3, status: "Active" as const },
    { name: "Bar Area", size: "2.1 MB", format: "JPG", daysAgo: 5, status: "Review" as const },
    { name: "Outdoor Patio", size: "2.8 MB", format: "JPG", daysAgo: 6, status: "Active" as const },
    { name: "Chef in Kitchen", size: "3.5 MB", format: "PNG", daysAgo: 8, status: "Active" as const },
    { name: "Menu Board", size: "1.8 MB", format: "JPG", daysAgo: 10, status: "Draft" as const },
    { name: "Happy Hour Specials", size: "2.3 MB", format: "JPG", daysAgo: 12, status: "Active" as const },
    { name: "Dessert Display", size: "2.7 MB", format: "PNG", daysAgo: 15, status: "Active" as const },
    { name: "Storefront Display", size: "2.4 MB", format: "JPG", daysAgo: 18, status: "Active" as const },
    { name: "Product Showcase", size: "3.1 MB", format: "JPG", daysAgo: 20, status: "Review" as const },
  ]

  return restaurantImages.map((img, index) => ({
    id: index + 1,
    name: img.name,
    type: "Images" as const,
    category: "Client Assets" as const,
    project: "",
    size: img.size,
    format: img.format,
    uploaded: getDateString(img.daysAgo),
    status: img.status,
  }))
}

// Calculate dummy stats from dummy data
const calculateDummyStats = (data: FilesAssets[]) => {
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

  // Initialize with dummy data
  useEffect(() => {
    setIsLoading(true)
    // Simulate loading delay
    setTimeout(() => {
      const dummyData = createDummyGalleryData()
      setData(dummyData)
      setStats(calculateDummyStats(dummyData))
      setIsLoading(false)
    }, 300)
  }, [])

  const handleUploadSuccess = () => {
    // Dummy: just show a toast, don't actually update data
    toast.success("File upload initiated (demo mode)")
    // In real implementation, would refresh data here
  }

  const handleGoogleDriveImportSuccess = () => {
    // Dummy: just show a toast, don't actually update data
    toast.success("Google Drive import initiated (demo mode)")
    // In real implementation, would refresh data here
  }

  const handleDataChange = () => {
    // Dummy: refresh with same dummy data
    const dummyData = createDummyGalleryData()
    setData(dummyData)
    setStats(calculateDummyStats(dummyData))
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {!isLoading && (
          <GalleryImagesScroll 
            data={data} 
            onUploadClick={() => setIsUploadModalOpen(true)}
            onGoogleDriveImportClick={() => setIsGoogleDriveImportModalOpen(true)}
          />
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : (
          <ClientImagesTable 
            data={data} 
            onUploadClick={() => setIsUploadModalOpen(true)}
            onGoogleDriveImportClick={() => setIsGoogleDriveImportModalOpen(true)}
            onDataChange={handleDataChange}
          />
          )}
        </div>

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      
      <GoogleDriveImportModal
        isOpen={isGoogleDriveImportModalOpen}
        onClose={() => setIsGoogleDriveImportModalOpen(false)}
        onImportSuccess={handleGoogleDriveImportSuccess}
      />
    </div>
  )
}

