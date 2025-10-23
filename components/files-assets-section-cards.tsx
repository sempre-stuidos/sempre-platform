import { IconFolder, IconFile, IconPhoto, IconVideo, IconTrendingUp } from "@tabler/icons-react"

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

interface FilesAssetsStats {
  totalFiles: number
  filesThisWeek: number
  uploadsToday: number
  totalProjects: number
  storageUsedBytes: number
  storageUsedGB: number
  storagePercentage: number
  storageLimit: number
}

interface FilesAssetsSectionCardsProps {
  stats: FilesAssetsStats
}

export function FilesAssetsSectionCards({ stats }: FilesAssetsSectionCardsProps) {
  const {
    totalFiles,
    filesThisWeek,
    uploadsToday,
    totalProjects,
    storageUsedGB,
    storagePercentage,
    storageLimit,
  } = stats

  const isGrowing = filesThisWeek > 0
  const isActive = uploadsToday > 0
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Files & Storage</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalFiles.toLocaleString()} {totalFiles === 1 ? 'File' : 'Files'}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconFile />
                +{filesThisWeek} this week
              </Badge>
              <div className="w-20">
                <Progress value={storagePercentage} className="h-2" />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowing ? 'Growing asset library' : 'Asset library'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {storageUsedGB.toFixed(1)} GB used ({Math.round(storagePercentage)}% of {storageLimit}GB limit) • Project and client assets organized
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Activity & Access</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {uploadsToday} {uploadsToday === 1 ? 'Upload' : 'Uploads'} Today
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconPhoto />
                {isActive ? 'Active' : 'Idle'}
              </Badge>
              <Badge variant="outline">
                <IconVideo />
                {totalProjects} {totalProjects === 1 ? 'Project' : 'Projects'}
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isActive ? 'Active collaboration' : 'Ready for uploads'} <IconPhoto className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isActive ? 'Team sharing assets regularly' : 'No uploads today'} • Direct links to project assets
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
