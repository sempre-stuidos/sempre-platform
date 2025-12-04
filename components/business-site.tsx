"use client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconPlus, IconEdit, IconTrash, IconEye } from "@tabler/icons-react"

import { Page } from "@/lib/types"

interface BusinessSiteProps {
  orgId: string
  canManage: boolean
  pages: Page[]
}

export function BusinessSite({ orgId, canManage, pages }: BusinessSiteProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
      case 'dirty':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published'
      case 'draft':
        return 'Draft'
      case 'dirty':
        return 'Has Unpublished Changes'
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {pages.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Site Pages</CardTitle>
            <CardDescription>
              Create your first site page to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canManage && (
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Last Updated</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(page.status)}>
                      {formatStatus(page.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IconEye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">-</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(page.updated_at)}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.location.href = `/client/${orgId}/restaurant/pages`}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

