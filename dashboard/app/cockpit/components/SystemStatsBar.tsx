'use client'

import { useAgentStatus } from '../hooks/useAgentStatus'
import { useAgentLogs } from '../hooks/useAgentLogs'
import { useEffect, useState } from 'react'
import styles from '../cockpit.module.css'

function formatUptime(): string {
  const now = new Date()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const diff = now.getTime() - startOfDay.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}min`
}

export function SystemStatsBar() {
  const { agents } = useAgentStatus()
  const { logs } = useAgentLogs(100)
  const [uptime, setUptime] = useState(formatUptime())

  // Update uptime every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const activeAgents = agents.filter((a) => a.isActive).length
  const totalActionsToday = agents.reduce((sum, a) => sum + a.actionsToday, 0)
  const successRate =
    logs.length > 0
      ? Math.round((logs.filter((l) => l.status === 'success').length / logs.length) * 100)
      : 100

  const lastActivity =
    logs.length > 0
      ? (() => {
          const now = new Date()
          const lastLog = new Date(logs[0].created_at)
          const diff = now.getTime() - lastLog.getTime()
          const minutes = Math.floor(diff / (1000 * 60))
          if (minutes < 1) return "À l'instant"
          if (minutes < 60) return `il y a ${minutes}min`
          return `il y a ${Math.floor(minutes / 60)}h`
        })()
      : 'Aucune activité'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total actions */}
      <div
        className={`
          p-4 rounded-xl backdrop-blur-md
          bg-gradient-to-br from-blue-500/10 to-blue-900/10
          border border-blue-500/30
          ${styles.fadeInUp}
        `}
        style={{ animationDelay: '0s' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Actions aujourd'hui</p>
            <p className="text-2xl font-bold text-blue-400">{totalActionsToday}</p>
          </div>
        </div>
      </div>

      {/* Active agents */}
      <div
        className={`
          p-4 rounded-xl backdrop-blur-md
          bg-gradient-to-br from-green-500/10 to-green-900/10
          border border-green-500/30
          ${styles.fadeInUp}
        `}
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <div className={`w-6 h-6 flex items-center justify-center`}>
              <div className={`w-3 h-3 rounded-full bg-green-500 ${styles.pulse}`} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Agents actifs</p>
            <p className="text-2xl font-bold text-green-500">{activeAgents}/6</p>
          </div>
        </div>
      </div>

      {/* Success rate */}
      <div
        className={`
          p-4 rounded-xl backdrop-blur-md
          bg-gradient-to-br from-cyan-500/10 to-cyan-900/10
          border border-cyan-500/30
          ${styles.fadeInUp}
        `}
        style={{ animationDelay: '0.2s' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <svg
              className="w-6 h-6 text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Taux de succès</p>
            <p className="text-2xl font-bold text-cyan-500">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* Last activity */}
      <div
        className={`
          p-4 rounded-xl backdrop-blur-md
          bg-gradient-to-br from-purple-500/10 to-purple-900/10
          border border-purple-500/30
          ${styles.fadeInUp}
        `}
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <svg
              className="w-6 h-6 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Dernière activité</p>
            <p className="text-lg font-bold text-purple-500">{lastActivity}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
