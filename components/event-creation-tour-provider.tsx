"use client"

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEventCreationTour } from '@/hooks/use-event-creation-tour'

export function EventCreationTourProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startTour, startTourFromStep } = useEventCreationTour()
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Check if tour should auto-start or continue
    const tourParam = searchParams.get('tour')
    const tourActive = typeof window !== 'undefined' 
      ? sessionStorage.getItem('event-creation-tour-active')
      : null
    const tourContinue = typeof window !== 'undefined'
      ? sessionStorage.getItem('event-creation-tour-continue')
      : null

    const shouldStartTour = tourParam === 'event-creation' || tourActive === 'true'
    
    if (shouldStartTour) {
      // Wait for page to fully load and DOM to be ready
      const timer = setTimeout(() => {
        if (pathname?.includes('/events/new')) {
          // On new event page, continue from step 2 (title field) or from continue step
          const stepToStart = tourContinue ? parseInt(tourContinue, 10) : 2
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('event-creation-tour-continue')
          }
          startTourFromStep(stepToStart)
          hasStartedRef.current = true
        } else if (pathname?.includes('/events') && !pathname?.includes('/events/new') && !pathname?.includes('/events/[')) {
          // On events list page, start from beginning
          if (!hasStartedRef.current) {
            startTour()
            hasStartedRef.current = true
          }
        }
      }, 800)

      return () => clearTimeout(timer)
    } else {
      // Reset when tour is not active
      hasStartedRef.current = false
    }
  }, [pathname, searchParams, startTour, startTourFromStep])

  return null
}

