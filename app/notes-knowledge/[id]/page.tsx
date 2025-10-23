import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ProposalDetail } from "@/components/proposal-detail"
import { getNotesKnowledgeById } from "@/lib/notes-knowledge"
import { notFound } from "next/navigation"

interface ProposalPageProps {
  params: {
    id: string
  }
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const proposalId = parseInt(params.id)
  
  if (isNaN(proposalId)) {
    notFound()
  }

  const proposal = await getNotesKnowledgeById(proposalId)
  
  if (!proposal || proposal.type !== 'Proposal') {
    notFound()
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
        <SiteHeader clientName="Proposal Details" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <ProposalDetail proposal={proposal} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
