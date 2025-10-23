"use client"

import { IconPlus, IconDownload, IconEye, IconTrash, IconFile, IconFileText, IconFileTypePdf, IconPhoto, IconFileSpreadsheet } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"

interface Attachment {
  id: number
  name: string
  type: "proposal" | "contract" | "invoice" | "document" | "image" | "other"
  fileType: string
  size: string
  uploadedBy: string
  uploadedAt: string
  url: string
}

interface ClientAttachmentsProps {
  clientId: number
}

export function ClientAttachments({ clientId }: ClientAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: 1,
      name: "Project Proposal - Landing Page Development.pdf",
      type: "proposal",
      fileType: "pdf",
      size: "2.4 MB",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2024-01-15T10:30:00Z",
      url: "#"
    },
    {
      id: 2,
      name: "Service Agreement - Signed.pdf",
      type: "contract",
      fileType: "pdf",
      size: "1.8 MB",
      uploadedBy: "Mike Chen",
      uploadedAt: "2024-01-16T14:20:00Z",
      url: "#"
    },
    {
      id: 3,
      name: "Invoice #INV-2024-001.pdf",
      type: "invoice",
      fileType: "pdf",
      size: "0.9 MB",
      uploadedBy: "Emily Davis",
      uploadedAt: "2024-01-20T09:15:00Z",
      url: "#"
    },
    {
      id: 4,
      name: "Brand Guidelines.pdf",
      type: "document",
      fileType: "pdf",
      size: "5.2 MB",
      uploadedBy: "Alex Rodriguez",
      uploadedAt: "2024-01-12T16:45:00Z",
      url: "#"
    },
    {
      id: 5,
      name: "Logo Variations.png",
      type: "image",
      fileType: "png",
      size: "3.1 MB",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2024-01-14T11:30:00Z",
      url: "#"
    },
    {
      id: 6,
      name: "Project Timeline.xlsx",
      type: "document",
      fileType: "xlsx",
      size: "0.7 MB",
      uploadedBy: "Mike Chen",
      uploadedAt: "2024-01-18T13:20:00Z",
      url: "#"
    }
  ])

  const [newAttachment, setNewAttachment] = useState({
    name: "",
    type: "document" as "proposal" | "contract" | "invoice" | "document" | "image" | "other",
    file: null as File | null
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <IconFileTypePdf className="h-5 w-5 text-red-500" />
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <IconPhoto className="h-5 w-5 text-green-500" />
      case "xlsx":
      case "xls":
        return <IconFileSpreadsheet className="h-5 w-5 text-green-600" />
      case "doc":
      case "docx":
        return <IconFileText className="h-5 w-5 text-blue-500" />
      default:
        return <IconFile className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeColor = (type: Attachment["type"]) => {
    switch (type) {
      case "proposal":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "contract":
        return "bg-green-100 text-green-800 border-green-200"
      case "invoice":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "document":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "image":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "other":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewAttachment({ ...newAttachment, file, name: file.name })
    }
  }

  const handleUpload = () => {
    if (newAttachment.file && newAttachment.name) {
      const attachment: Attachment = {
        id: attachments.length + 1,
        name: newAttachment.name,
        type: newAttachment.type,
        fileType: newAttachment.file.name.split('.').pop() || 'unknown',
        size: `${(newAttachment.file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: "Current User",
        uploadedAt: new Date().toISOString(),
        url: "#"
      }
      setAttachments([attachment, ...attachments])
      setNewAttachment({ name: "", type: "document", file: null })
      setIsUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    setAttachments(attachments.filter(attachment => attachment.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const groupedAttachments = attachments.reduce((acc, attachment) => {
    if (!acc[attachment.type]) {
      acc[attachment.type] = []
    }
    acc[attachment.type].push(attachment)
    return acc
  }, {} as Record<string, Attachment[]>)

  const typeLabels = {
    proposal: "Proposals",
    contract: "Contracts",
    invoice: "Invoices",
    document: "Documents",
    image: "Images",
    other: "Other"
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {isUploading && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Attachment</CardTitle>
            <CardDescription>Add a new file to this client&apos;s folder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachmentName">File Name</Label>
              <Input
                id="attachmentName"
                value={newAttachment.name}
                onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                placeholder="Enter file name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachmentType">Type</Label>
              <Select
                value={newAttachment.type}
                onValueChange={(value: string) => setNewAttachment({ ...newAttachment, type: value as "proposal" | "contract" | "invoice" | "document" | "image" | "other" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={!newAttachment.file || !newAttachment.name}>
                Upload File
              </Button>
              <Button variant="outline" onClick={() => setIsUploading(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments by Type */}
      <div className="space-y-6">
        {Object.entries(groupedAttachments).map(([type, typeAttachments]) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{typeLabels[type as keyof typeof typeLabels]}</CardTitle>
                  <CardDescription>{typeAttachments.length} file{typeAttachments.length !== 1 ? 's' : ''}</CardDescription>
                </div>
                {!isUploading && (
                  <Button onClick={() => setIsUploading(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add {typeLabels[type as keyof typeof typeLabels].slice(0, -1)}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(attachment.fileType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{attachment.name}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getTypeColor(attachment.type)}`}
                          >
                            {attachment.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{attachment.size}</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {getInitials(attachment.uploadedBy)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{attachment.uploadedBy}</span>
                          </div>
                          <span>{formatDate(attachment.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <IconEye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <IconDownload className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {attachments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconFile className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No attachments yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload proposals, contracts, invoices, and other documents for this client.
            </p>
            <Button onClick={() => setIsUploading(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Upload First File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
