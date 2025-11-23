import React from 'react'

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return children without any layout wrapper - full screen
  return <>{children}</>
}

