"use client"

import * as React from "react"
import {
  IconDashboard,
  IconPhoto,
  IconMenu2,
  IconFileText,
  IconBuilding,
  IconChartBar,
  IconCalendar,
  IconBook,
  IconTools,
  IconReport,
  IconShoppingCart,
  IconPackage,
  IconMusic,
  IconLock,
  IconLifebuoy,
} from "@tabler/icons-react"
import { useParams, usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import { QuickActionsModalContent } from "@/components/quick-actions-modal"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconCheck,
  IconPaperclip,
  IconLoader2,
} from "@tabler/icons-react"

const requestCategories = [
  "Update photos",
  "Change menu",
  "Add event",
  "Update business hours",
  "Add or replace text",
  "Fix layout on desktop or mobile",
  "Something else",
]
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useBusinessContext } from "@/hooks/use-business-context"
import type { Business } from "@/lib/businesses"

const defaultUser = {
  name: "User",
  email: "user@example.com",
  avatar: "",
}

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
  initialBusiness?: Business | null
}

const getClientNavItems = (orgId: string, businessType?: string) => {
  // Determine which business-specific items to show
  // Default to restaurant if type doesn't match
  const isRetail = businessType === 'retail'
  const isRestaurant = businessType === 'restaurant' || !isRetail

  return {
    main: [
      {
        title: "Dashboard",
        url: `/client/${orgId}/dashboard`,
        icon: IconDashboard,
      },
    ],
    restaurant: isRestaurant ? [
      {
        title: "Reservations",
        url: `/client/${orgId}/reservations`,
        icon: IconCalendar,
      },
      {
        title: "Menu",
        url: `/client/${orgId}/restaurant/menu`,
        icon: IconMenu2,
      },
      {
        title: "Events",
        url: `/client/${orgId}/events`,
        icon: IconCalendar,
      },
      {
        title: "Bands",
        url: `/client/${orgId}/bands`,
        icon: IconMusic,
      },
    ] : [],
    data: isRestaurant ? [
      {
        title: "Analytics",
        url: `/client/${orgId}/analytics`,
        icon: IconChartBar,
      },
      {
        title: "Reports",
        url: `/client/${orgId}/reports`,
        icon: IconReport,
      },
    ] : [],
    retail: isRetail ? [
      {
        title: "Orders",
        url: `/client/${orgId}/retail/orders`,
        icon: IconShoppingCart,
      },
      {
        title: "Products",
        url: `/client/${orgId}/retail/products`,
        icon: IconPackage,
      },
      {
        title: "Blog",
        url: `/client/${orgId}/retail/blogs`,
        icon: IconFileText,
      },
    ] : [],
    help: [
      {
        title: "How To",
        url: `/client/${orgId}/how-to`,
        icon: IconBook,
      },
      {
        title: "Maintenance",
        url: `/client/${orgId}/maintenance`,
        icon: IconTools,
      },
    ],
    site: [
      {
        title: "Pages",
        url: `/client/${orgId}/restaurant/pages`,
        icon: IconFileText,
      },
      {
        title: "Gallery",
        url: `/client/${orgId}/restaurant/gallery`,
        icon: IconPhoto,
      },
    ],
  }
}

function HelpButton() {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    category: "",
    description: "",
    file: null as File | null,
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.category || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      toast.success("We received your request. Our team will follow up shortly.")
      setFormData({ category: "", description: "", file: null })
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: event.target.files![0] }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="Help" className="hover:bg-primary hover:text-primary-foreground">
          <IconLifebuoy className="h-4 w-4" />
          <span>Help</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <QuickActionsModalContent 
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          handleFileChange={handleFileChange}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ClientSidebar({ initialBusiness, ...props }: ClientSidebarProps) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgId as string
  const { business: contextBusiness, isLoading: orgLoading } = useBusinessContext()
  // Use initialBusiness if provided (from server), otherwise use context business (from client fetch)
  const business = initialBusiness || contextBusiness
  const [user, setUser] = React.useState(defaultUser)

  React.useEffect(() => {
    const getInitialUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const fullName = authUser.user_metadata?.first_name && authUser.user_metadata?.last_name
            ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
            : authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'

          setUser({
            name: fullName,
            email: authUser.email || '',
            avatar: authUser.user_metadata?.avatar_url || '',
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }

    getInitialUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void event;
      if (session?.user) {
        const fullName = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name
          ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}`
          : session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'

        setUser({
          name: fullName,
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || '',
        })
      } else {
        setUser(defaultUser)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Get business type, default to 'restaurant' if not available
  const businessType = business?.type || 'restaurant'
  const navItems = orgId ? getClientNavItems(orgId, businessType) : { main: [], restaurant: [], retail: [], help: [], site: [], data: [] }

  const [lockedFeatureDialogOpen, setLockedFeatureDialogOpen] = React.useState(false)
  const [lockedFeatureName, setLockedFeatureName] = React.useState<string>("")

  const handleLockedFeatureClick = (featureName: string, e: React.MouseEvent) => {
    e.preventDefault()
    setLockedFeatureName(featureName)
    setLockedFeatureDialogOpen(true)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-2 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href={orgId ? `/client/${orgId}/dashboard` : '#'}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <IconBuilding className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {orgLoading ? 'Loading...' : business?.name || 'Business'}
                    </span>
                    <span className="truncate text-xs">Client Portal</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.main.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      data-active={isActive}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navItems.restaurant.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.restaurant.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {navItems.retail.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Retail</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.retail.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.site.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                const isLocked = false
                
                return (
                  <SidebarMenuItem key={item.title} className={isLocked ? "group-data-[collapsible=icon]:hidden" : ""}>
                    <SidebarMenuButton 
                      asChild={!isLocked}
                      tooltip={item.title}
                      className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      data-active={isActive}
                      onClick={isLocked ? (e) => handleLockedFeatureClick(item.title, e) : undefined}
                    >
                      {isLocked ? (
                        <button className="flex w-full items-center gap-2">
                          {item.icon && <item.icon className="size-3" />}
                          <span>{item.title}</span>
                          <IconLock className="ml-auto size-3 opacity-50" />
                        </button>
                      ) : (
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navItems.data.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Data</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.data.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  const isLocked = item.title === "Analytics" || item.title === "Reports"
                  
                  return (
                    <SidebarMenuItem key={item.title} className={isLocked ? "group-data-[collapsible=icon]:hidden" : ""}>
                      <SidebarMenuButton 
                        asChild={!isLocked}
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                        onClick={isLocked ? (e) => handleLockedFeatureClick(item.title, e) : undefined}
                      >
                        {isLocked ? (
                          <button className="flex w-full items-center gap-2">
                            {item.icon && <item.icon className="size-3" />}
                            <span>{item.title}</span>
                            <IconLock className="ml-auto size-3 opacity-50" />
                          </button>
                        ) : (
                          <a href={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </a>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Help & Support group hidden for now */}
        {false && navItems.help.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Help & Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.help.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Help button at the end of sidebar content */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <HelpButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <Dialog open={lockedFeatureDialogOpen} onOpenChange={setLockedFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Locked</DialogTitle>
            <DialogDescription>
              Contact Sempre Studio team to unlock this feature.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}

