"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconBell,
  IconLogout,
  IconMail,
  IconSettings,
  IconUser,
  IconWallet,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function AccountSidebar() {
  const { currentUser, isLoading } = useCurrentUser()
  const pathname = usePathname()
  const router = useRouter()

  // Generate user initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success("Logged out successfully")
      router.push('/login')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to log out")
    }
  }

  if (isLoading || !currentUser) {
    return (
      <div className="w-64 border-r border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* User Profile Card */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-20 w-20">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="text-lg">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-semibold text-sm">{currentUser.name}</p>
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
          >
            <IconMail className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
              5
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <IconUser className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <IconBell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        <nav className="space-y-1">
          <Link
            href="/account"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/account'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <IconUser className="h-4 w-4" />
            <span>Profile</span>
            <span className="ml-auto">›</span>
          </Link>
          <Link
            href="/account/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/account/settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <IconSettings className="h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto">›</span>
          </Link>
          <Link
            href="/account/billing"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/account/billing'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <IconWallet className="h-4 w-4" />
            <span>Billing</span>
            <span className="ml-auto">›</span>
          </Link>
        </nav>
      </div>

      {/* Logout Button at Bottom */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <IconLogout className="h-4 w-4" />
          <span>Logout</span>
          <span className="ml-auto">›</span>
        </button>
      </div>
    </div>
  )
}
