'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface AgentStatus {
  name: string
  displayName: string
  icon: string
  isActive: boolean
  lastRun: Date | null
  nextRun: Date | null
  lastAction: string
  actionsToday: number
  activityData: number[] // 24 data points for sparkline
  status: 'success' | 'error' | 'warning' | 'idle'
}

const AGENT_DEFINITIONS = [
  {
    name: 'relance-devis',
    displayName: 'Relance Devis',
    icon: '📋',
    schedule: 9, // runs at 9 AM
  },
  {
    name: 'daily-briefing',
    displayName: 'Daily Briefing',
    icon: '📊',
    schedule: 8, // runs at 8 AM
  },
  {
    name: 'avis-client',
    displayName: 'Avis Client',
    icon: '⭐',
    schedule: 17, // runs at 5 PM
  },
  {
    name: 'suivi-chantier',
    displayName: 'Suivi Chantier',
    icon: '🏗️',
    schedule: 10, // runs at 10 AM
  },
  {
    name: 'prospection',
    displayName: 'Prospection',
    icon: '🎯',
    schedule: 14, // runs at 2 PM
  },
  {
    name: 'reporting',
    displayName: 'Reporting',
    icon: '📈',
    schedule: 18, // runs at 6 PM
  },
]

function calculateNextRun(scheduleHour: number): Date {
  const now = new Date()
  const next = new Date()
  next.setHours(scheduleHour, 0, 0, 0)

  // If we've passed today's run time, schedule for tomorrow
  if (now.getHours() >= scheduleHour) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

function generateActivityData(logs: any[]): number[] {
  // Generate 24 hours of activity data (one point per hour)
  const now = new Date()
  const activityByHour = new Array(24).fill(0)

  logs.forEach((log) => {
    const logDate = new Date(log.created_at)
    const hoursDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60))

    if (hoursDiff >= 0 && hoursDiff < 24) {
      activityByHour[23 - hoursDiff]++
    }
  })

  return activityByHour
}

export function useAgentStatus() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgentStatus = async () => {
    try {
      const supabase = createClient()

      // Fetch logs from last 24 hours
      const { data: logs, error } = await supabase
        .from('agent_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const agentStatuses = AGENT_DEFINITIONS.map((def) => {
        const agentLogs = logs?.filter((log) => log.agent_name === def.name) || []
        const lastLog = agentLogs[0]

        // Count actions today (since midnight)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const actionsToday = agentLogs.filter(
          (log) => new Date(log.created_at) >= todayStart
        ).length

        return {
          name: def.name,
          displayName: def.displayName,
          icon: def.icon,
          isActive: lastLog
            ? new Date().getTime() - new Date(lastLog.created_at).getTime() < 5 * 60 * 1000
            : false,
          lastRun: lastLog ? new Date(lastLog.created_at) : null,
          nextRun: calculateNextRun(def.schedule),
          lastAction: lastLog?.action || 'Aucune action',
          actionsToday,
          activityData: generateActivityData(agentLogs),
          status: lastLog?.status === 'error' ? 'error' : lastLog ? 'success' : 'idle',
        } as AgentStatus
      })

      setAgents(agentStatuses)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching agent status:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentStatus()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAgentStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          // Force re-render to update countdown displays
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { agents, loading, refetch: fetchAgentStatus }
}
