import { IconTrendingUp, IconUsers, IconFolder, IconCalendar, IconNote } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DashboardStats } from "@/lib/types"

interface SectionCardsProps {
  stats: DashboardStats;
}

export function SectionCards({ stats }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Clients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeClients}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
              {stats.clientGrowth > 0 ? `+${stats.clientGrowth}` : stats.clientGrowth} this month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.clientGrowth >= 0 ? 'Growing client base' : 'Client base stable'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Quick access to client profiles
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeProjects}
          </CardTitle>
          <CardAction>
            <div className="w-20">
              <Progress value={stats.projectProgress} className="h-2" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.projectProgress}% average completion <IconFolder className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.projectProgress >= 70 ? 'On track for delivery' : 'Projects in progress'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasks Due This Week</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.tasksThisWeek}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCalendar />
              {stats.tasksThisWeek > 5 ? 'High Priority' : 'Manageable'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.tasksThisWeek > 0 ? 'Deadline approaching' : 'No urgent tasks'} <IconCalendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.tasksThisWeek > 0 ? 'Review and prioritize tasks' : 'Good time to plan ahead'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recent Notes Added</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.recentNotes}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconNote />
              +{stats.notesToday} today
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.recentNotes > 0 ? 'Team collaboration active' : 'Knowledge base ready'} <IconNote className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.recentNotes > 0 ? 'Knowledge base growing' : 'Add notes to track progress'}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
