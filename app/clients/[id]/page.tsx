import { AppSidebar } from "@/components/app-sidebar"
import { ClientProfile } from "@/components/client-profile"
import { ClientServices } from "@/components/client-services"
import { ClientNotes } from "@/components/client-notes"
import { ClientAttachments } from "@/components/client-attachments"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconEdit, IconShare } from "@tabler/icons-react"
import Link from "next/link"

import clientsData from "../clients-data.json"

interface ClientDetailsPageProps {
  params: {
    id: string
  }
}

export default function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const clientId = parseInt(params.id)
  const client = clientsData.find(c => c.id === clientId)

  if (!client) {
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
                <div className="text-center py-12">
                  <h1 className="text-2xl font-semibold">Client not found</h1>
                  <p className="text-muted-foreground mt-2">The client you're looking for doesn't exist.</p>
                  <Link href="/clients">
                    <Button className="mt-4">
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Back to Clients
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
        <SiteHeader clientName={client.name} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <Link href="/clients">
                    <Button variant="ghost" size="sm">
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Back to Clients
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <IconShare className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button size="sm">
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Client
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="mt-6">
                    <ClientProfile client={client} />
                  </TabsContent>
                  
                  <TabsContent value="services" className="mt-6">
                    <ClientServices clientId={clientId} />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="mt-6">
                    <ClientNotes clientId={clientId} />
                  </TabsContent>
                  
                  <TabsContent value="attachments" className="mt-6">
                    <ClientAttachments clientId={clientId} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
