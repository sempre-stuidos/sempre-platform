import { IconMenu, IconPhoto, IconFileText, IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ClientDashboardStats } from "@/lib/types"

interface ClientDashboardStatsProps {
  stats: ClientDashboardStats;
}

export function ClientDashboardStats({ stats }: ClientDashboardStatsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Menu Items</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.menuItemsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconMenu className="size-4" />
              Active items
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Manage your restaurant menu <IconMenu className="size-4" />
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/restaurant/menu">
              View Menu <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Gallery Images</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.galleryImagesCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPhoto className="size-4" />
              Uploaded
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Showcase your restaurant <IconPhoto className="size-4" />
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/restaurant/gallery">
              View Gallery <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Site Pages</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.sectionsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconFileText className="size-4" />
              Configured
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Manage website pages <IconFileText className="size-4" />
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/restaurant/pages">
              View Pages <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

