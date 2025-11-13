import { IconUsers, IconFileText, IconTrendingUp, IconUserCheck, IconEye } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OrganizationStats {
  totalMembers: number
  membersThisMonth: number
  totalSitePages: number
  publishedPages: number
  activeMembers: number
  organizationType: 'agency' | 'client'
}

interface OrganizationSectionCardsProps {
  stats: OrganizationStats
}

export function OrganizationSectionCards({ stats }: OrganizationSectionCardsProps) {
  const {
    totalMembers,
    membersThisMonth,
    totalSitePages,
    publishedPages,
    activeMembers,
    organizationType,
  } = stats

  const isGrowing = membersThisMonth > 0
  const isActive = activeMembers > 0
  const publishRate = totalSitePages > 0 ? Math.round((publishedPages / totalSitePages) * 100) : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Team & Members</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalMembers.toLocaleString()} {totalMembers === 1 ? 'Member' : 'Members'}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconUsers />
                +{membersThisMonth} this month
              </Badge>
              <Badge variant="outline">
                <IconUserCheck />
                {activeMembers} active
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowing ? 'Growing team' : 'Team members'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {activeMembers > 0 ? `${activeMembers} active members` : 'No active members'} • Manage roles and permissions
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Site Pages</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSitePages.toLocaleString()} {totalSitePages === 1 ? 'Page' : 'Pages'}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconFileText />
                {publishedPages} published
              </Badge>
              <Badge variant="outline">
                <IconEye />
                {publishRate}% live
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {publishedPages > 0 ? 'Active site' : 'Site ready'} <IconFileText className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {publishedPages > 0 ? `${publishedPages} of ${totalSitePages} pages published` : 'No pages published yet'} • Manage site content
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

