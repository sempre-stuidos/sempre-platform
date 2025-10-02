import { AppSidebar } from "@/components/app-sidebar"
import { FilesAssetsDataTable } from "@/components/files-assets-data-table"
import { FilesAssetsSectionCards } from "@/components/files-assets-section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getAllFilesAssets } from "@/lib/files-assets"

export default async function Page() {
  // Fetch files-assets data from database
  const data = await getAllFilesAssets()
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
              <FilesAssetsSectionCards />
              <FilesAssetsDataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
