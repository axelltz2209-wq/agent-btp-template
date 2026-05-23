'use client'

import { AgentStatus } from '../hooks/useAgentStatus'
import { SparklineChart } from './SparklineChart'
import { TriggerButton } from './TriggerButton'
import styles from '../cockpit.module.css'

interface AgentCardProps {
  agent: AgentStatus
  index: number
  onTrigger: () => void
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'Jamais exécuté'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes}min`
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${days}j`
}

function formatCountdown(date: Date | null): string {
  if (!date) return 'Non programmé'

  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (diff < 0) return 'En retard'
  if (hours < 1) return `dans ${minutes}min`
  return `dans ${hours}h ${minutes}min`
}

export function AgentCard({ agent, index, onTrigger }: AgentCardProps) {
  const isActive = agent.isActive
  const hasError = agent.status === 'error'

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-6
        backdrop-blur-md
        border transition-all duration-300
        ${styles.fadeInUp}
        ${
          isActive
            ? `${styles.glow} bg-gradient-to-br from-orange-500/10 to-orange-900/10 border-orange-500/50`
            : hasError
              ? 'bg-gradient-to-br from-red-500/5 to-red-900/5 border-red-500/30'
              : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-orange-500/30'
        }
      `}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-white">{agent.displayName}</h3>
            <p className="text-sm text-gray-400">{agent.name}</p>
          </div>
        </div>

        {/* Pulse indicator */}
        <div className="relative">
          <div
            className={`
              w-3 h-3 rounded-full
              ${isActive ? `bg-green-500 ${styles.pulseFast}` : hasError ? 'bg-red-500' : 'bg-gray-600'}
            `}
          />
          {isActive && (
            <div
              className="absolute inset-0 w-3 h-3 rounded-full bg-green-500/50"
              style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}
            />
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Dernière exécution</span>
          <span className="text-sm text-white font-medium">{formatTimeAgo(agent.lastRun)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Prochaine exécution</span>
          <span className="text-sm text-cyan-400 font-medium">{formatCountdown(agent.nextRun)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Actions aujourd'hui</span>
          <span className="text-sm text-orange-400 font-bold">{agent.actionsToday}</span>
        </div>
      </div>

      {/* Last action */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Dernière action</p>
        <p className="text-sm text-gray-300 truncate">{agent.lastAction}</p>
      </div>

      {/* Sparkline */}
      <div className="mb-4 flex justify-center">
        <SparklineChart data={agent.activityData} width={200} height={40} color="#f97316" />
      </div>

      {/* Trigger button */}
      <TriggerButton agentName={agent.name} onTrigger={onTrigger} />

      {/* Scan line effect when active */}
      {isActive && (
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"
          style={{
            animation: 'scan 2s linear infinite',
          }}
        />
      )}
    </div>
  )
}
