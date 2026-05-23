'use client'

import { useAgentLogs } from '../hooks/useAgentLogs'
import styles from '../cockpit.module.css'

const AGENT_COLORS: Record<string, string> = {
  'relance-devis': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'daily-briefing': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'avis-client': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'suivi-chantier': 'bg-green-500/20 text-green-400 border-green-500/50',
  'prospection': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  'reporting': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
}

const STATUS_COLORS: Record<string, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes}min`
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export function ActivityFeed() {
  const { logs, loading, connected } = useAgentLogs(50)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Activité en temps réel</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} ${connected ? styles.pulse : ''}`}
            />
            <span className="text-xs text-gray-400">
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">{logs.length} entrées</div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-gray-800/50 border border-gray-700/50 animate-pulse"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucune activité récente
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={`
                p-4 rounded-lg backdrop-blur-md
                bg-gradient-to-br from-gray-800/50 to-gray-900/50
                border border-gray-700/50
                hover:border-orange-500/30
                transition-all duration-300
                ${styles.slideIn}
              `}
              style={{
                animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Agent badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`
                        px-2 py-1 rounded-md text-xs font-medium border
                        ${AGENT_COLORS[log.agent_name] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'}
                      `}
                    >
                      {log.agent_name}
                    </span>
                    <span className={`text-xs ${STATUS_COLORS[log.status] || 'text-gray-400'}`}>
                      {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⚠'}
                    </span>
                  </div>

                  {/* Action */}
                  <p className="text-sm text-gray-300 mb-1">{log.action}</p>

                  {/* Details */}
                  {log.details && (
                    <p className="text-xs text-gray-500 truncate">{log.details}</p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(log.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
