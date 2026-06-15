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
  icon: React.ReactNode
}

const AgentIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    mail: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    sun: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    alert: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    chart: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    star: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    trending: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  }
  return <>{icons[type] || icons.chart}</>
}

const AGENTS: (AgentInfo & { iconType: string; color: string })[] = [
  {
    name: 'relance-devis',
    displayName: 'Relance Devis',
    description: "Relance automatique des devis en attente depuis plus de 3 jours",
    schedule: '20h00 quotidien',
    iconType: 'mail',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: null,
  },
  {
    name: 'daily-briefing',
    displayName: 'Daily Briefing',
    description: "Résumé quotidien de l'activité et des chantiers du jour",
    schedule: '7h00 quotidien',
    iconType: 'sun',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    icon: null,
  },
  {
    name: 'urgent-alert',
    displayName: 'Urgent Alert',
    description: "Alertes pour les devis en attente depuis plus de 7 jours",
    schedule: 'Toutes les 6h',
    iconType: 'alert',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    icon: null,
  },
  {
    name: 'calcul-ca',
    displayName: 'CA Hebdomadaire',
    description: "Calcul du chiffre d'affaires prévu pour la semaine",
    schedule: 'Lundi 8h00',
    iconType: 'chart',
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
    icon: null,
  },
  {
    name: 'avis-google',
    displayName: 'Avis Google',
    description: "Demande d'avis Google pour les chantiers terminés",
    schedule: '9h00 quotidien',
    iconType: 'star',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    icon: null,
  },
  {
    name: 'rentabilite-chantier',
    displayName: 'Rentabilité',
    description: "Analyse de la rentabilité des chantiers en cours",
    schedule: '21h00 quotidien',
    iconType: 'trending',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    icon: null,
  },
]

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
    const channel = supabase
      .channel('agent-logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_logs' }, () => { fetchLogs() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchLogs() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('agent_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (fetchError) throw fetchError
      setLogs(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getLastLog = (agentName: string) => logs.find((log) => log.agent_name === agentName)

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
        if (today < now) today.setDate(today.getDate() + 1)
      }
    }

    return today.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const getActionsToday = (agentName: string): number => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return logs.filter((log) => log.agent_name === agentName && new Date(log.created_at) >= todayStart).length
  }

  const getStatusStyle = (status: string | undefined) => {
    if (!status) return 'bg-zinc-800/60 text-zinc-500'
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-400 border border-green-500/20'
      case 'error': return 'bg-red-500/10 text-red-400 border border-red-500/20'
      case 'warning': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      default: return 'bg-zinc-800/60 text-zinc-500'
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-600">Chargement...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px] flex items-center justify-center p-4">
          <div className="max-w-md card-btp p-8">
            <h3 className="text-red-400 font-semibold text-base mb-2">Erreur de connexion</h3>
            <p className="text-zinc-500 text-sm">{error}</p>
            <button onClick={fetchLogs} className="mt-6 btn-primary w-full">Réessayer</button>
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
        <div className="page-header px-8 py-6 slide-in-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Agents IA</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Surveillance en temps réel des agents autonomes</p>
            </div>
            <button onClick={fetchLogs} className="btn-secondary group flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {AGENTS.map((agent, i) => {
              const lastLog = getLastLog(agent.name)
              const actionsToday = getActionsToday(agent.name)

              return (
                <div
                  key={agent.name}
                  className="card-btp p-5 hover:border-zinc-700 transition-all duration-150 fade-in"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${agent.color}`}>
                        <AgentIcon type={agent.iconType} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100 text-sm leading-tight">{agent.displayName}</h3>
                        <p className="text-xs text-zinc-600 mt-0.5">{agent.schedule}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lastLog ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800/60 text-zinc-600'}`}>
                      {lastLog ? 'ACTIF' : 'PAUSE'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{agent.description}</p>

                  {/* Stats */}
                  <div className="space-y-2.5 pt-4" style={{ borderTop: '1px solid #1f1f23' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">Dernière exécution</span>
                      <span className="font-medium text-zinc-400">
                        {lastLog
                          ? new Date(lastLog.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : 'Jamais'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">Prochaine exécution</span>
                      <span className="font-medium text-zinc-400">{getNextRun(agent.schedule)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">Actions aujourd'hui</span>
                      <span className="font-bold text-blue-400">{actionsToday}</span>
                    </div>

                    {lastLog && (
                      <div className="pt-3" style={{ borderTop: '1px solid #1f1f23' }}>
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusStyle(lastLog.status)}`}>
                            {lastLog.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-zinc-500 line-clamp-2 flex-1">{lastLog.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Activity Feed */}
          <div className="card-btp overflow-hidden fade-in">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #27272a' }}>
              <div className="flex items-center gap-2.5">
                <div className="indicator-dot" />
                <h2 className="text-sm font-semibold text-zinc-100">Activité récente</h2>
                <span className="ml-auto text-xs text-zinc-600">20 dernières actions</span>
              </div>
            </div>

            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {logs.slice(0, 20).map((log) => {
                const agent = AGENTS.find((a) => a.name === log.agent_name)

                return (
                  <div
                    key={log.id}
                    className="px-6 py-4 transition-colors duration-150"
                    style={{ borderColor: '#1f1f23' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#18181f')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${agent?.color || 'text-zinc-400 bg-zinc-800/60 border-zinc-700'}`}>
                        {agent ? <AgentIcon type={agent.iconType} /> : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-zinc-200 text-sm">{agent?.displayName || log.agent_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 mb-1 line-clamp-1">{log.action}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-700">
                          <span>
                            {new Date(log.created_at).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {log.details && (
                            <span className="truncate max-w-xs" title={log.details}>
                              {log.details.substring(0, 80)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {logs.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-zinc-600 text-sm">Aucune activité enregistrée pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
