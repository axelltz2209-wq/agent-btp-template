'use client'

import { useEffect, useState } from 'react'
import { supabase, Devis, Chantier } from '@/lib/supabase'
import DevisTable from '@/components/DevisTable'
import ChantiersTable from '@/components/ChantiersTable'
import ChartsSection from '@/components/ChartsSection'
import Sidebar from '@/components/Sidebar'
import companyConfig from '@/config/company'

export default function Dashboard() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()

    // Subscribe to real-time changes
    const devisChannel = supabase
      .channel('devis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => {
        fetchData()
      })
      .subscribe()

    const chantiersChannel = supabase
      .channel('chantiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(devisChannel)
      supabase.removeChannel(chantiersChannel)
    }
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch devis
      const { data: devisData, error: devisError } = await supabase
        .from('devis')
        .select('*')
        .order('date_envoi', { ascending: false })

      if (devisError) throw devisError

      // Fetch chantiers
      const { data: chantiersData, error: chantiersError } = await supabase
        .from('chantiers')
        .select('*')
        .order('date_debut', { ascending: true })

      if (chantiersError) throw chantiersError

      setDevis(devisData || [])
      setChantiers(chantiersData || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary stats
  const devisEnAttente = devis.filter((d) => d.statut === 'en_attente')
  const totalPipeline = devis.reduce((sum, d) => sum + Number(d.montant), 0)
  const totalDevisEnAttente = devisEnAttente.reduce((sum, d) => sum + Number(d.montant), 0)

  // Get chantiers for this week
  const getWeekChantiers = () => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Sunday

    return chantiers.filter((c) => {
      const startDate = new Date(c.date_debut)
      return startDate >= weekStart && startDate <= weekEnd
    })
  }

  const weekChantiers = getWeekChantiers()
  const totalCAWeek = weekChantiers.reduce((sum, c) => sum + Number(c.montant_devis), 0)
  const chantiersEnCours = chantiers.filter((c) => c.statut === 'en_cours').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-premium p-8 max-w-md scale-in">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
            Erreur de connexion
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
            {error}
          </p>
          <button onClick={fetchData} className="btn-primary w-full">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />

      <main className="flex-1 ml-[240px]">
        {/* Header */}
        <div className="border-b px-8 py-8 bg-[var(--color-surface)] slide-in-left" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                letterSpacing: 'var(--tracking-tight)'
              }}>
                Tableau de bord
              </h1>
              <p className="text-base" style={{ color: 'var(--color-text-tertiary)' }}>
                {companyConfig.name}
              </p>
            </div>
            <button onClick={fetchData} className="btn-secondary group flex items-center gap-2">
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

        {/* Stats Row - 4 cards */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stat 1: Total Pipeline */}
            <div className="card-premium p-6 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-blue)' }}></div>
                <div className="stat-label">Pipeline Total</div>
              </div>
              <div className="stat-display mb-2">
                {totalPipeline.toLocaleString('fr-FR')}€
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {devis.length} devis au total
              </div>
            </div>

            {/* Stat 2: Devis en attente */}
            <div className="card-premium p-6 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-amber)' }}></div>
                <div className="stat-label">En Attente</div>
              </div>
              <div className="stat-display mb-2">
                {devisEnAttente.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {totalDevisEnAttente.toLocaleString('fr-FR')}€
              </div>
            </div>

            {/* Stat 3: Chantiers cette semaine */}
            <div className="card-premium p-6 fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-purple)' }}></div>
                <div className="stat-label">Cette Semaine</div>
              </div>
              <div className="stat-display mb-2">
                {weekChantiers.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {totalCAWeek.toLocaleString('fr-FR')}€ prévu
              </div>
            </div>

            {/* Stat 4: Chantiers en cours */}
            <div className="card-premium p-6 fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-emerald)' }}></div>
                <div className="stat-label">En Cours</div>
              </div>
              <div className="stat-display mb-2">
                {chantiersEnCours}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Chantiers actifs
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-8">
            <ChartsSection devis={devis} chantiers={chantiers} />
          </div>

          {/* Tables Section */}
          <div className="space-y-8">
            <DevisTable devis={devisEnAttente} />
            <ChantiersTable chantiers={chantiers.filter((c) => c.statut !== 'termine')} />
          </div>
        </div>
      </main>
    </div>
  )
}
