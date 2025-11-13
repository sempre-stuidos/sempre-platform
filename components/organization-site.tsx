"use client"

import { useState } from "react"
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

interface OrganizationSiteProps {
  orgId: string
  canManage: boolean
}

interface SitePage {
  id: number
  name: string
  path: string
  status: 'Published' | 'Draft' | 'Archived'
  lastUpdated: string
  views: number
}

// Dummy data for now
const dummySitePages: SitePage[] = [
  {
    id: 1,
    name: 'Home',
    path: '/',
    status: 'Published',
    lastUpdated: '2024-01-15',
    views: 1250,
  },
  {
    id: 2,
    name: 'About',
    path: '/about',
    status: 'Published',
    lastUpdated: '2024-01-14',
    views: 890,
  },
  {
    id: 3,
    name: 'Menu',
    path: '/menu',
    status: 'Published',
    lastUpdated: '2024-01-13',
    views: 2100,
  },
  {
    id: 4,
    name: 'Gallery',
    path: '/gallery',
    status: 'Published',
    lastUpdated: '2024-01-12',
    views: 1560,
  },
  {
    id: 5,
    name: 'Contact',
    path: '/contact',
    status: 'Draft',
    lastUpdated: '2024-01-10',
    views: 0,
  },
  {
    id: 6,
    name: 'Events',
    path: '/events',
    status: 'Archived',
    lastUpdated: '2024-01-05',
    views: 450,
  },
]

export function OrganizationSite({ orgId, canManage }: OrganizationSiteProps) {
  const [pages, setPages] = useState<SitePage[]>(dummySitePages)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
      default:
        return ''
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
                  <TableCell className="text-muted-foreground">{page.path}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(page.status)}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IconEye className="h-4 w-4 text-muted-foreground" />
                      {page.views.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{page.lastUpdated}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <IconTrash className="h-4 w-4 text-destructive" />
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

