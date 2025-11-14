"use client"

import * as React from "react"

interface BreadcrumbContextType {
  breadcrumb: string | null
  setBreadcrumb: (breadcrumb: string | null) => void
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType>({
  breadcrumb: null,
  setBreadcrumb: () => {},
})

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumb, setBreadcrumb] = React.useState<string | null>(null)

  return (
    <BreadcrumbContext.Provider value={{ breadcrumb, setBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  return React.useContext(BreadcrumbContext)
}


