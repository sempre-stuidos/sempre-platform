"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { IconBrandGoogleDrive, IconLoader2, IconFile, IconFolder, IconSearch, IconPhoto, IconFileText, IconPresentation, IconFileTypePdf } from "@tabler/icons-react"
import { toast } from "sonner"
import { getAllProjects } from "@/lib/projects"
import type { Project } from "@/lib/types"
import type { GoogleDriveFile } from "@/lib/google-drive"

interface GoogleDriveImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: () => void
}

type FileTypeTab = "all" | "images" | "documents" | "presentations" | "pdfs" | "other"

export function GoogleDriveImportModal({ isOpen, onClose, onImportSuccess }: GoogleDriveImportModalProps) {
  const [files, setFiles] = useState<GoogleDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<"Client Assets" | "Project Assets">("Project Assets")
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<FileTypeTab>("all")

  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus()
      loadProjects()
    }
  }, [isOpen])

  const checkConnectionStatus = async () => {
    setIsCheckingConnection(true)
    try {
      const response = await fetch('/api/google-drive/status')
      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.connected)
        if (data.connected) {
          loadFiles()
        }
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error checking Google Drive status:', error)
      setIsConnected(false)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const handleConnect = () => {
    // Include return URL so callback knows where to redirect
    window.location.href = '/api/google-drive/connect?return_url=/files-assets'
  }

  const loadProjects = async () => {
    try {
      const projectList = await getAllProjects()
      setProjects(projectList)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadFiles = async (pageToken?: string) => {
    setLoadingFiles(true)
    try {
      const url = new URL('/api/google-drive/files', window.location.origin)
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        if (response.status === 400) {
          setIsConnected(false)
          return
        }
        throw new Error('Failed to load files')
      }

      const data = await response.json()
      if (pageToken) {
        setFiles(prev => [...prev, ...data.files])
      } else {
        setFiles(data.files)
      }
      setNextPageToken(data.nextPageToken)
    } catch (error) {
      console.error('Error loading Google Drive files:', error)
      toast.error('Failed to load files from Google Drive')
      setIsConnected(false)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleFileToggle = (fileId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  // Categorize files by type
  const categorizeFile = (mimeType: string): FileTypeTab => {
    if (mimeType.includes('folder')) return "other"
    if (mimeType.includes('image')) return "images"
    if (mimeType.includes('pdf')) return "pdfs"
    if (mimeType.includes('presentation') || mimeType.includes('vnd.google-apps.presentation')) return "presentations"
    if (mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('vnd.google-apps')) return "documents"
    return "other"
  }

  // Filter and categorize files
  const { filteredFiles, filesByType } = useMemo(() => {
    // Filter by search query
    const searchFiltered = files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Categorize files
    const categorized: Record<FileTypeTab, GoogleDriveFile[]> = {
      all: searchFiltered,
      images: [],
      documents: [],
      presentations: [],
      pdfs: [],
      other: []
    }

    searchFiltered.forEach(file => {
      const category = categorizeFile(file.mimeType)
      if (category !== "all") {
        categorized[category].push(file)
      }
    })

    return {
      filteredFiles: categorized[activeTab] || [],
      filesByType: categorized
    }
  }, [files, searchQuery, activeTab])

  // Initialize filesByType with empty arrays if not yet computed
  const safeFilesByType = filesByType || {
    all: [],
    images: [],
    documents: [],
    presentations: [],
    pdfs: [],
    other: []
  }

  const handleImport = async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select at least one file to import')
      return
    }

    if (!selectedProject && selectedCategory === "Project Assets") {
      toast.error('Please select a project')
      return
    }

    setLoading(true)
    try {
      const project = projects.find(p => p.id.toString() === selectedProject)
      const projectName = project?.name || "Unassigned"

      const importPromises = Array.from(selectedFiles).map(fileId =>
        fetch('/api/google-drive/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            projectName,
            category: selectedCategory,
          }),
        })
      )

      const results = await Promise.all(importPromises)
      const successful = results.filter(r => r.ok).length

      if (successful > 0) {
        toast.success(`Successfully imported ${successful} file(s)`)
        setSelectedFiles(new Set())
        onImportSuccess?.()
        onClose()
      } else {
        toast.error('Failed to import files')
      }
    } catch (error) {
      console.error('Error importing files:', error)
      toast.error('Failed to import files')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) {
      return <IconFolder className="size-5 text-blue-500" />
    }
    if (mimeType.includes('image')) {
      return <IconPhoto className="size-5 text-green-500" />
    }
    if (mimeType.includes('pdf')) {
      return <IconFileTypePdf className="size-5 text-red-500" />
    }
    if (mimeType.includes('presentation')) {
      return <IconPresentation className="size-5 text-purple-500" />
    }
    if (mimeType.includes('document') || mimeType.includes('spreadsheet')) {
      return <IconFileText className="size-5 text-blue-500" />
    }
    return <IconFile className="size-5 text-gray-500" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBrandGoogleDrive className="size-5 text-blue-600" />
            Import Files from Google Drive
          </DialogTitle>
          <DialogDescription>
            {isConnected 
              ? "Select files from your Google Drive to import into the platform"
              : "Connect your Google Drive account to import files"}
          </DialogDescription>
        </DialogHeader>

        {isCheckingConnection ? (
          <div className="flex items-center justify-center h-64">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <IconBrandGoogleDrive className="size-16 text-blue-600 opacity-50" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Google Drive Not Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Google Drive account to import files directly from your Drive.
              </p>
            </div>
            <Button onClick={handleConnect} size="lg">
              <IconBrandGoogleDrive className="size-4 mr-2" />
              Connect Google Drive
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Selection Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(value: "Client Assets" | "Project Assets") => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Assets">Project Assets</SelectItem>
                  <SelectItem value="Client Assets">Client Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedCategory === "Project Assets" && (
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* File Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FileTypeTab)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({files.length})</TabsTrigger>
              <TabsTrigger value="images">Images ({safeFilesByType.images.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({safeFilesByType.documents.length})</TabsTrigger>
              <TabsTrigger value="presentations">Presentations ({safeFilesByType.presentations.length})</TabsTrigger>
              <TabsTrigger value="pdfs">PDFs ({safeFilesByType.pdfs.length})</TabsTrigger>
              <TabsTrigger value="other">Other ({safeFilesByType.other.length})</TabsTrigger>
            </TabsList>

            {/* Files List for each tab */}
            <TabsContent value={activeTab} className="mt-4">
              <div className="h-[400px] overflow-y-auto border rounded-md p-4">
                {loadingFiles ? (
                  <div className="flex items-center justify-center h-full">
                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                      {searchQuery ? `No files found matching "${searchQuery}"` : `No ${activeTab === "all" ? "" : activeTab} files found in your Google Drive`}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const imageFiles = filteredFiles.filter(f => f.mimeType.includes('image'))
                      const otherFiles = filteredFiles.filter(f => !f.mimeType.includes('image'))
                      
                      return (
                        <>
                          {/* Image Grid - 3 columns */}
                          {imageFiles.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {imageFiles.map((file) => {
                                const imageUrl = `/api/google-drive/thumbnail?fileId=${file.id}&size=200`
                                
                                return (
                                  <div
                                    key={file.id}
                                    className={`relative group rounded-md border overflow-hidden cursor-pointer hover:bg-muted transition-all ${
                                      selectedFiles.has(file.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
                                    }`}
                                    onClick={() => handleFileToggle(file.id)}
                                  >
                                    <div className="aspect-square relative bg-muted">
                                      <img
                                        src={imageUrl}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to icon if image fails to load
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const parent = target.parentElement
                                          if (parent) {
                                            parent.innerHTML = `
                                              <div class="w-full h-full flex items-center justify-center">
                                                <svg class="size-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                              </div>
                                            `
                                          }
                                        }}
                                      />
                                      {/* Checkbox overlay */}
                                      <div className="absolute top-2 left-2 z-10">
                                        <input
                                          type="checkbox"
                                          checked={selectedFiles.has(file.id)}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            handleFileToggle(file.id, e)
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="size-5 cursor-pointer rounded border-2 border-white bg-white/80 checked:bg-blue-500 checked:border-blue-500"
                                        />
                                      </div>
                                      {/* Selection overlay */}
                                      {selectedFiles.has(file.id) && (
                                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                          <div className="size-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-2">
                                      <div className="text-xs font-medium truncate" title={file.name}>
                                        {file.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Unknown'}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {/* Other Files List */}
                          {otherFiles.length > 0 && (
                            <div className="space-y-2">
                              {otherFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors ${
                                    selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-500' : ''
                                  }`}
                                  onClick={() => handleFileToggle(file.id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.has(file.id)}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      handleFileToggle(file.id, e)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="size-4 cursor-pointer"
                                  />
                                  {getFileIcon(file.mimeType)}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{file.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : 'Unknown size'} • {file.mimeType.split('/').pop()}
                                    </div>
                                  </div>
                                  {file.webViewLink && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(file.webViewLink, '_blank')
                                      }}
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Load More Button */}
          {nextPageToken && (
            <Button
              variant="outline"
              onClick={() => loadFiles(nextPageToken)}
              disabled={loadingFiles}
              className="w-full"
            >
              {loadingFiles ? 'Loading...' : 'Load More'}
            </Button>
          )}

            {/* Selected Count */}
            {selectedFiles.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedFiles.size} file(s) selected
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isConnected && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={loading || selectedFiles.size === 0}>
              {loading ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedFiles.size > 0 ? `${selectedFiles.size} ` : ''}File(s)`
              )}
            </Button>
          </div>
        )}
        {!isConnected && !isCheckingConnection && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

