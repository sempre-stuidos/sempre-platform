"use client"

import { useEffect, useRef, useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { eventCreationTourSteps } from '@/lib/event-creation-tour'

// Global driver instance to persist across route changes
let globalDriverInstance: ReturnType<typeof driver> | null = null

export function useEventCreationTour() {
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Initialize driver only once
    if (!isInitializedRef.current && typeof window !== 'undefined') {
      globalDriverInstance = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: eventCreationTourSteps,
        popoverClass: 'driverjs-theme',
        popoverOffset: 10,
        allowClose: true,
        smoothScroll: true,
        disableActiveInteraction: false,
        onCloseClick: () => {
          console.log('Close button clicked - destroying tour')
          // Explicitly destroy the tour when close button is clicked
          if (globalDriverInstance) {
            globalDriverInstance.destroy()
          }
        },
        onDestroyStarted: () => {
          console.log('Tour destroy started')
          // Clean up tour state immediately
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('event-creation-tour-active')
            sessionStorage.removeItem('event-creation-tour-continue')
            const url = new URL(window.location.href)
            url.searchParams.delete('tour')
            window.history.replaceState({}, '', url.toString())
          }
          // Ensure destroy completes - Driver.js should handle this automatically
          // But if it doesn't, we'll force it in onDestroyed
        },
        onDestroyed: () => {
          console.log('Tour destroyed')
          // Reset when tour is completely destroyed
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('event-creation-tour-active')
            sessionStorage.removeItem('event-creation-tour-continue')
          }
          // Force remove any remaining tour elements if they exist
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const overlay = document.querySelector('.driver-overlay')
              const popover = document.querySelector('.driver-popover')
              if (overlay) overlay.remove()
              if (popover) popover.remove()
            }
          }, 100)
        },
        onHighlightStarted: (element, step, options) => {
          // Get current step index from global driver instance
          const stepIndex = globalDriverInstance?.getActiveIndex?.() ?? -1
          const stepElement = step?.element || (element ? element.getAttribute('data-tour') : null)
          console.log('Tour highlighting step:', stepIndex, 'Element:', stepElement)
          
          // Check if element exists
          if (step?.element && typeof window !== 'undefined') {
            const foundElement = document.querySelector(step.element)
            if (!foundElement) {
              console.error('Tour element not found:', step.element)
              // Try to find it with a delay (for dynamically loaded content)
              setTimeout(() => {
                const retryElement = document.querySelector(step.element)
                if (!retryElement) {
                  console.error('Tour element still not found after retry:', step.element)
                } else {
                  console.log('Tour element found on retry:', step.element)
                }
              }, 500)
            } else {
              console.log('Tour element found:', step.element, foundElement)
            }
          }
        },
        onNextClick: (element, step, options) => {
          // Get current step index from global driver instance
          const currentIndex = globalDriverInstance?.getActiveIndex?.() ?? -1
          const totalSteps = eventCreationTourSteps.length
          const isLastStep = currentIndex === totalSteps - 1
          
          console.log('Tour next clicked, current index:', currentIndex, 'Is last step:', isLastStep)
          
          // If we're on the last step, explicitly close the tour
          if (isLastStep) {
            console.log('Last step - closing tour')
            // Explicitly destroy the tour when "Done" is clicked
            if (globalDriverInstance) {
              setTimeout(() => {
                globalDriverInstance?.destroy()
              }, 0)
            }
            return false // Prevent default behavior since we're handling it
          }
          
          // If we're on the "New Event" button step (index 1), handle navigation
          if (currentIndex === 1) {
            // Step 1 is the "New Event" button
            // Check if we're still on the events page (not /events/new)
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/events/new')) {
              // Set flag to continue tour after navigation
              sessionStorage.setItem('event-creation-tour-continue', '2')
              // Extract orgId from current path and navigate
              const pathMatch = window.location.pathname.match(/\/client\/([^/]+)\/events/)
              if (pathMatch && pathMatch[1]) {
                const orgId = pathMatch[1]
                // Navigate to new event page - use setTimeout to allow Driver.js to finish current step
                setTimeout(() => {
                  window.location.href = `/client/${orgId}/events/new?tour=event-creation`
                }, 100)
                return false // Prevent Driver.js from advancing (we're navigating)
              }
            }
          }
          
          // For all other steps, manually advance the tour
          // We need to do this because we've overridden onNextClick
          if (globalDriverInstance) {
            // Use setTimeout to ensure this happens after any other processing
            setTimeout(() => {
              globalDriverInstance?.moveNext()
            }, 0)
          }
          return false // Prevent default (we're manually advancing)
        },
        onHighlightedElementClick: (element, step, options) => {
          // Get current step index from global driver instance
          const stepIndex = globalDriverInstance?.getActiveIndex?.() ?? -1
          // If user clicks the highlighted "New Event" button, mark to continue
          if (stepIndex === 1 && typeof window !== 'undefined') {
            sessionStorage.setItem('event-creation-tour-continue', '2')
          }
        },
      })
      isInitializedRef.current = true
    }

    return () => {
      // Don't destroy on unmount, keep it alive for navigation
    }
  }, [])

  const startTour = useCallback(() => {
    if (globalDriverInstance) {
      // Mark tour as active
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('event-creation-tour-active', 'true')
      }
      // Wait for DOM to be ready and verify first step element exists
      const checkAndStart = () => {
        if (typeof window !== 'undefined') {
          const firstElement = document.querySelector('[data-tour="events-page"]')
          if (firstElement) {
            console.log('First tour element found, starting tour')
            try {
              globalDriverInstance?.drive()
            } catch (error) {
              console.error('Error starting tour:', error)
            }
          } else {
            console.warn('First tour element not found, retrying...')
            setTimeout(checkAndStart, 100)
          }
        }
      }
      setTimeout(checkAndStart, 300)
    }
  }, [])

  const startTourFromStep = useCallback((stepIndex: number) => {
    if (globalDriverInstance) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('event-creation-tour-active', 'true')
      }
      // Wait a bit for DOM to be ready, especially for form elements
      setTimeout(() => {
        try {
          globalDriverInstance?.drive(stepIndex)
        } catch (error) {
          console.error('Error starting tour from step:', error)
        }
      }, 500)
    }
  }, [])

  return {
    startTour,
    startTourFromStep,
  }
}

