'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseExample() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('_supabase_migrations')
          .select('*')
          .limit(1)
        
        if (error) {
          console.error('Supabase connection error:', error)
          setIsConnected(false)
        } else {
          console.log('Supabase connected successfully!')
          setIsConnected(true)
        }
      } catch (err) {
        console.error('Connection test failed:', err)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Testing Supabase connection...</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Status</h3>
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>
          {isConnected ? 'Connected to Supabase' : 'Failed to connect to Supabase'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Local Supabase is running at: {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>
    </div>
  )
}
