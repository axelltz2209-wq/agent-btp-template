import { BackgroundEffects } from './components/BackgroundEffects'
import { SystemStatsBar } from './components/SystemStatsBar'
import { AgentGrid } from './components/AgentGrid'
import { ActivityFeed } from './components/ActivityFeed'

export const metadata = {
  title: 'Cockpit | Agent BTP Dashboard',
  description: 'Centre de contrôle en temps réel pour les agents IA',
}

export default function CockpitPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] p-6">
      {/* Background effects */}
      <BackgroundEffects />

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span>⚡</span>
            Cockpit
          </h1>
          <p className="text-gray-400">
            Centre de contrôle en temps réel pour le monitoring et la gestion des agents IA
          </p>
        </div>

        {/* System stats bar */}
        <SystemStatsBar />

        {/* Main grid: Agents + Activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent grid (2/3 width) */}
          <div className="lg:col-span-2">
            <AgentGrid />
          </div>

          {/* Activity feed (1/3 width) */}
          <div className="lg:col-span-1">
            <div
              className="
                sticky top-6 h-[calc(100vh-8rem)]
                p-6 rounded-xl backdrop-blur-md
                bg-gradient-to-br from-gray-800/50 to-gray-900/50
                border border-gray-700/50
              "
            >
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
