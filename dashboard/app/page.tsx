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
    const devisChannel = supabase
      .channel('devis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => fetchData())
      .subscribe()
    const chantiersChannel = supabase
      .channel('chantiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, () => fetchData())
      .subscribe()
    return () => {
      supabase.removeChannel(devisChannel)
      supabase.removeChannel(chantiersChannel)
    }
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: devisData, error: devisError } = await supabase
        .from('devis').select('*').order('date_envoi', { ascending: false })
      if (devisError) throw devisError
      const { data: chantiersData, error: chantiersError } = await supabase
        .from('chantiers').select('*').order('date_debut', { ascending: true })
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

  const devisEnAttente = devis.filter((d) => d.statut === 'en_attente')
  const totalPipeline = devis.reduce((sum, d) => sum + Number(d.montant), 0)
  const totalDevisEnAttente = devisEnAttente.reduce((sum, d) => sum + Number(d.montant), 0)

  const getWeekChantiers = () => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return chantiers.filter((c) => {
      const d = new Date(c.date_debut)
      return d >= weekStart && d <= weekEnd
    })
  }

  const weekChantiers = getWeekChantiers()
  const totalCAWeek = weekChantiers.reduce((sum, c) => sum + Number(c.montant_devis), 0)
  const chantiersEnCours = chantiers.filter((c) => c.statut === 'en_cours').length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-btp p-8 max-w-md fade-in">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-base font-semibold mb-2 text-slate-900">Erreur de connexion</h3>
          <p className="text-sm mb-6 text-slate-500">{error}</p>
          <button onClick={fetchData} className="btn-primary w-full">Réessayer</button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Pipeline Total',
      value: `${totalPipeline.toLocaleString('fr-FR')}€`,
      sub: `${devis.length} devis au total`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
    {
      label: 'En Attente',
      value: String(devisEnAttente.length),
      sub: `${totalDevisEnAttente.toLocaleString('fr-FR')}€`,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: 'Cette Semaine',
      value: String(weekChantiers.length),
      sub: `${totalCAWeek.toLocaleString('fr-FR')}€ prévu`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      label: 'En Cours',
      value: String(chantiersEnCours),
      sub: 'Chantiers actifs',
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        {/* Header */}
        <div className="page-header px-8 py-6 slide-in-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
              <p className="text-sm text-slate-400 mt-0.5">{companyConfig.name}</p>
            </div>
            <button onClick={fetchData} className="btn-secondary group flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className="stat-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="stat-number">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-2">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="mb-8">
            <ChartsSection devis={devis} chantiers={chantiers} />
          </div>

          {/* Tables */}
          <div className="space-y-6">
            <DevisTable devis={devisEnAttente} />
            <ChantiersTable chantiers={chantiers.filter((c) => c.statut !== 'termine')} />
          </div>
        </div>
      </main>
    </div>
  )
}
