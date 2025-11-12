"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { FilesAssetsDataTable } from "@/components/files-assets-data-table"
import { FilesAssetsSectionCards } from "@/components/files-assets-section-cards"
import { SiteHeader } from "@/components/site-header"
import { UploadFileModal } from "@/components/upload-file-modal"
import { GoogleDriveImportModal } from "@/components/google-drive-import-modal"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { toast } from "sonner"

import { getAllFilesAssets, getFilesAssetsStats } from "@/lib/files-assets"
import { FilesAssets } from "@/lib/types"

export default function Page() {
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

  // Fetch files-assets data and stats from database
  const fetchData = async () => {
    setIsLoading(true)
    const [filesAssets, fileStats] = await Promise.all([
      getAllFilesAssets(),
      getFilesAssetsStats()
    ])
    setData(filesAssets)
    setStats(fileStats)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    // Check if user just connected Google Drive and should open import modal
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('google_drive_connected') === 'true' && urlParams.get('open_import') === 'true') {
      toast.success('Google Drive connected successfully!')
      setIsGoogleDriveImportModalOpen(true)
      // Clean up URL
      window.history.replaceState({}, '', '/files-assets')
    }
  }, [])

  const handleUploadSuccess = () => {
    // Refresh data after successful upload
    fetchData()
  }

  const handleGoogleDriveImportSuccess = () => {
    // Refresh data after successful import
    fetchData()
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <FilesAssetsSectionCards stats={stats} />
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : (
                <FilesAssetsDataTable 
                  data={data} 
                  onUploadClick={() => setIsUploadModalOpen(true)}
                  onGoogleDriveImportClick={() => setIsGoogleDriveImportModalOpen(true)}
                  onDataChange={fetchData}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
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
    </SidebarProvider>
  )
}
