"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TakeTourButtonProps {
  tutorialTitle: string
  orgId: string
}

export function TakeTourButton({ tutorialTitle, orgId }: TakeTourButtonProps) {
  const router = useRouter()

  const handleTakeTour = () => {
    // Check if this is the "Creating Events" tutorial
    if (tutorialTitle === 'Creating Events') {
      // Set tour flag in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('event-creation-tour-active', 'true')
      }
      // Navigate to events page with tour parameter
      router.push(`/client/${orgId}/events?tour=event-creation`)
    }
  }

  // Only show button for "Creating Events" tutorial
  if (tutorialTitle !== 'Creating Events') {
    return null
  }

  return (
    <Button onClick={handleTakeTour}>
      Take Tour
    </Button>
  )
}

