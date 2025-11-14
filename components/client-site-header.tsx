"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"

export function ClientSiteHeader() {
  const pathname = usePathname()
  
  // Determine page name based on pathname
  let pageName = "Dashboard"
  if (pathname?.includes("/reservations")) {
    pageName = "Reservations"
  } else if (pathname?.includes("/dashboard")) {
    pageName = "Dashboard"
  } else if (pathname?.includes("/analytics")) {
    pageName = "Analytics"
  } else if (pathname?.includes("/restaurant/pages")) {
    pageName = "Pages"
  } else if (pathname?.includes("/menu")) {
    pageName = "Menu"
  } else if (pathname?.includes("/gallery")) {
    pageName = "Gallery"
  } else if (pathname?.includes("/sections")) {
    pageName = "Page Sections"
  }
  
  return <SiteHeader clientName={pageName} />
}

