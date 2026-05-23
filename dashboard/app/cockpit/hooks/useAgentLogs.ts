'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AgentLog {
  id: string
  agent_name: string
  action: string
  status: 'success' | 'error' | 'warning'
  details: string | null
  created_at: string
}

export function useAgentLogs(limit: number = 50) {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        // Fetch initial logs
        const { data: initialLogs, error } = await supabase
          .from('agent_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error

        setLogs(initialLogs || [])
        setLoading(false)

        // Set up realtime subscription
        channel = supabase
          .channel('agent_logs_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'agent_logs',
            },
            (payload) => {
              const newLog = payload.new as AgentLog

              setLogs((prevLogs) => {
                // Add new log to the beginning and limit to max entries
                const updatedLogs = [newLog, ...prevLogs].slice(0, limit)
                return updatedLogs
              })
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setConnected(true)
              console.log('✅ Realtime subscription active')
            } else if (status === 'CLOSED') {
              setConnected(false)
              console.log('❌ Realtime subscription closed')
            } else if (status === 'CHANNEL_ERROR') {
              setConnected(false)
              console.error('❌ Realtime subscription error')
            }
          })
      } catch (error) {
        console.error('Error setting up realtime subscription:', error)
        setLoading(false)
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        setConnected(false)
      }
    }
  }, [limit])

  return { logs, loading, connected }
}
