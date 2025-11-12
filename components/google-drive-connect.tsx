"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBrandGoogleDrive, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

export function GoogleDriveConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-drive/status')
      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.connected)
      }
    } catch (error) {
      console.error('Error checking Google Drive status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      window.location.href = '/api/google-drive/connect'
    } catch (error) {
      console.error('Error connecting Google Drive:', error)
      toast.error('Failed to connect Google Drive')
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google-drive/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        setIsConnected(false)
        toast.success('Google Drive disconnected successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to disconnect Google Drive')
      }
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error)
      toast.error('Failed to disconnect Google Drive')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive</CardTitle>
          <CardDescription>Checking connection status...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBrandGoogleDrive className="size-5 text-blue-600" />
            <CardTitle>Google Drive</CardTitle>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-green-600">
              <IconCheck className="size-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
        <CardDescription>
          {isConnected
            ? "Your Google Drive is connected. You can import files from your Drive."
            : "Connect your Google Drive account to import files directly."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              <IconX className="size-4 mr-2" />
              Disconnect
            </Button>
            <Button
              onClick={() => window.location.href = '/files-assets?import=google-drive'}
              disabled={isLoading}
            >
              Import Files
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full"
          >
            <IconBrandGoogleDrive className="size-4 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect Google Drive'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

