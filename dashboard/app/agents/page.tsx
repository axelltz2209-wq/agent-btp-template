'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface AgentLog {
  id: string
  agent_name: string
  action: string
  status: string
  details: string | null
  created_at: string
}

interface AgentInfo {
  name: string
  displayName: string
  description: string
  schedule: string
  emoji: string
}

const AGENTS: AgentInfo[] = [
  {
    name: 'relance-devis',
    displayName: 'Relance Devis',
    description: 'Relance automatique des devis en attente depuis plus de 3 jours',
    schedule: '20h00 quotidien',
    emoji: '📧',
  },
  {
    name: 'daily-briefing',
    displayName: 'Daily Briefing',
    description: 'Résumé quotidien de l\'activité et des chantiers du jour',
    schedule: '7h00 quotidien',
    emoji: '☀️',
  },
  {
    name: 'urgent-alert',
    displayName: 'Urgent Alert',
    description: 'Alertes urgentes pour les devis en attente depuis plus de 7 jours',
    schedule: 'Toutes les 6h',
    emoji: '🚨',
  },
  {
    name: 'calcul-ca',
    displayName: 'CA Hebdomadaire',
    description: 'Calcul du chiffre d\'affaires prévu pour la semaine',
    schedule: 'Lundi 8h00',
    emoji: '💰',
  },
  {
    name: 'avis-google',
    displayName: 'Avis Google',
    description: 'Demande d\'avis Google pour les chantiers terminés',
    schedule: '9h00 quotidien',
    emoji: '⭐',
  },
  {
    name: 'rentabilite-chantier',
    displayName: 'Rentabilité',
    description: 'Analyse de la rentabilité des chantiers en cours',
    schedule: '21h00 quotidien',
    emoji: '📊',
  },
]

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('agent-logs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_logs' },
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchLogs() {
    try {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      setLogs(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Get last log for each agent
  const getLastLog = (agentName: string): AgentLog | undefined => {
    return logs.find((log) => log.agent_name === agentName)
  }

  // Get next scheduled run time for each agent
  const getNextRun = (schedule: string): string => {
    const now = new Date()
    const today = new Date(now)

    if (schedule === 'Toutes les 6h') {
      const hours = [0, 6, 12, 18]
      const nextHour = hours.find((h) => h > now.getHours())
      if (nextHour !== undefined) {
        today.setHours(nextHour, 0, 0, 0)
      } else {
        today.setDate(today.getDate() + 1)
        today.setHours(0, 0, 0, 0)
      }
    } else if (schedule === 'Lundi 8h00') {
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7))
      nextMonday.setHours(8, 0, 0, 0)
      return nextMonday < now
        ? new Date(nextMonday.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString('fr-FR')
        : nextMonday.toLocaleString('fr-FR')
    } else {
      const match = schedule.match(/(\d+)h/)
      if (match) {
        const hour = parseInt(match[1])
        today.setHours(hour, 0, 0, 0)
        if (today < now) {
          today.setDate(today.getDate() + 1)
        }
      }
    }

    return today.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get actions count today for each agent
  const getActionsToday = (agentName: string): number => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    return logs.filter(
      (log) => log.agent_name === agentName && new Date(log.created_at) >= todayStart
    ).length
  }

  // Get status badge color
  const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-600'
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px]">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Chargement...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px]">
          <div className="flex items-center justify-center h-screen p-4">
            <div className="max-w-md card-btp p-8">
              <h3 className="text-red-600 font-semibold text-lg mb-3 font-primary">Erreur de connexion</h3>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-6 btn-primary w-full"
              >
                Réessayer
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 ml-[240px]">
        {/* Header */}
        <div className="border-b border-border bg-surface px-8 py-8 slide-in-left">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-secondary font-primary tracking-tight mb-2">Agents IA</h1>
              <p className="text-base text-gray-600">Surveillance en temps réel des agents autonomes</p>
            </div>
            <button
              onClick={fetchLogs}
              className="btn-secondary group flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {AGENTS.map((agent) => {
              const lastLog = getLastLog(agent.name)
              const actionsToday = getActionsToday(agent.name)
              const statusColor = getStatusColor(lastLog?.status)

              return (
                <div
                  key={agent.name}
                  className={`card-btp p-6 hover:border-primary transition-all duration-150 ${lastLog ? 'border-t-4 border-t-primary' : ''}`}
                >
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{agent.emoji}</div>
                      <div>
                        <h3 className="font-bold text-secondary text-base font-primary">{agent.displayName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{agent.schedule}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold font-primary ${lastLog ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {lastLog ? 'ACTIF' : 'EN PAUSE'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{agent.description}</p>

                  {/* Stats */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Dernière exécution</span>
                      <span className="font-medium text-secondary text-xs">
                        {lastLog
                          ? new Date(lastLog.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Jamais'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Prochaine exécution</span>
                      <span className="font-medium text-secondary text-xs">{getNextRun(agent.schedule)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Actions aujourd'hui</span>
                      <span className="font-bold text-primary text-sm">{actionsToday}</span>
                    </div>

                    {lastLog && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                            {lastLog.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-gray-600 line-clamp-2 flex-1">{lastLog.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Activity Feed */}
          <div className="card-btp overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="indicator-dot"></div>
                <h2 className="text-xl font-bold text-secondary font-primary">Activité récente</h2>
              </div>
              <p className="text-sm text-gray-600 mt-2">20 dernières actions des agents</p>
            </div>

            <div className="divide-y divide-border">
              {logs.slice(0, 20).map((log) => {
                const agent = AGENTS.find((a) => a.name === log.agent_name)
                const statusColor = getStatusColor(log.status)

                return (
                  <div
                    key={log.id}
                    className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-xl">{agent?.emoji || '🤖'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-secondary text-sm">
                            {agent?.displayName || log.agent_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{log.action}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            {new Date(log.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {log.details && (
                            <span className="truncate max-w-md" title={log.details}>
                              {log.details.substring(0, 100)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {logs.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-sm">Aucune activité enregistrée pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
