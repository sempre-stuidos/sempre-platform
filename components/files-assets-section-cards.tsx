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

export function FilesAssetsSectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Files & Storage</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,247 Files
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconFile />
                +23 this week
              </Badge>
              <div className="w-20">
                <Progress value={45} className="h-2" />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing asset library <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            2.4 GB used (45% of 5GB limit) • Project and client assets organized
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Activity & Access</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12 Uploads Today
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <IconPhoto />
                Active
              </Badge>
              <Badge variant="outline">
                <IconVideo />
                8 Projects
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active collaboration <IconPhoto className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Team sharing assets regularly • Direct links to project assets
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
