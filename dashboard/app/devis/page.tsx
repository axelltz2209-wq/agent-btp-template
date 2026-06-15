'use client'

import { useEffect, useState } from 'react'
import { supabase, Devis } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [filteredDevis, setFilteredDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchDevis()
    const channel = supabase
      .channel('devis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => { fetchDevis() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredDevis(devis)
    } else {
      setFilteredDevis(devis.filter((d) => d.statut === filterStatus))
    }
  }, [devis, filterStatus])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function fetchDevis() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('devis')
        .select('*')
        .order('date_envoi', { ascending: false })
      if (fetchError) throw fetchError
      setDevis(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function updateDevisStatus(id: string, newStatus: string, clientNom: string) {
    const statusLabels = {
      accepte: 'accepté',
      refuse: 'refusé',
      en_attente: 'remis en attente',
    }
    const confirmMessage =
      newStatus === 'accepte'
        ? `Accepter le devis de ${clientNom} ?`
        : newStatus === 'refuse'
        ? `Refuser le devis de ${clientNom} ?`
        : `Remettre le devis de ${clientNom} en attente ?`

    if (!window.confirm(confirmMessage)) return

    try {
      const { error: updateError } = await supabase
        .from('devis')
        .update({ statut: newStatus })
        .eq('id', id)
      if (updateError) throw updateError
      setToast({
        message: `Devis ${statusLabels[newStatus as keyof typeof statusLabels]} avec succès`,
        type: 'success',
      })
      await fetchDevis()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        type: 'error',
      })
    }
  }

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'en_attente': return 'badge badge-attente'
      case 'accepte': return 'badge badge-accepte'
      case 'refuse': return 'badge badge-refuse'
      default: return 'badge badge-attente'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'en_attente': return 'En attente'
      case 'accepte': return 'Accepté'
      case 'refuse': return 'Refusé'
      default: return status
    }
  }

  const calculateDaysWaiting = (dateEnvoi: string): number => {
    const now = new Date()
    const sent = new Date(dateEnvoi)
    return Math.ceil(Math.abs(now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))
  }

  const LoadingPage = () => (
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

  if (loading && devis.length === 0) return <LoadingPage />

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px] flex items-center justify-center p-4">
          <div className="max-w-md card-btp p-8">
            <h3 className="text-red-400 font-semibold text-base mb-2">Erreur de connexion</h3>
            <p className="text-zinc-500 text-sm">{error}</p>
            <button onClick={fetchDevis} className="mt-6 btn-primary w-full">Réessayer</button>
          </div>
        </main>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Devis', value: devis.length, sub: null, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'En Attente', value: devis.filter((d) => d.statut === 'en_attente').length, sub: 'Action requise', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Acceptés', value: devis.filter((d) => d.statut === 'accepte').length, sub: 'Validés', color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Refusés', value: devis.filter((d) => d.statut === 'refuse').length, sub: 'Non acceptés', color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 ml-[240px]">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 fade-in">
            <div className={`px-5 py-3.5 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {toast.message}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header px-8 py-6 slide-in-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Devis</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Gestion des devis clients</p>
            </div>
            <button onClick={fetchDevis} className="btn-secondary group flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <div key={s.label} className="stat-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{s.label}</div>
                  <div className={`w-2 h-2 rounded-full ${s.color} opacity-70`} style={{ background: 'currentColor' }} />
                </div>
                <div className="stat-number">{s.value}</div>
                {s.sub && <div className="text-xs text-zinc-600 mt-2">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {[
              { key: 'all', label: `Tous (${devis.length})` },
              { key: 'en_attente', label: `En attente (${devis.filter((d) => d.statut === 'en_attente').length})` },
              { key: 'accepte', label: `Acceptés (${devis.filter((d) => d.statut === 'accepte').length})` },
              { key: 'refuse', label: `Refusés (${devis.filter((d) => d.statut === 'refuse').length})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`filter-btn ${filterStatus === f.key ? 'filter-btn-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="card-btp overflow-hidden fade-in">
            <div className="overflow-x-auto">
              <table className="table-btp">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Montant</th>
                    <th>Date d'envoi</th>
                    <th>Jours d'attente</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevis.map((devisItem) => {
                    const daysWaiting = calculateDaysWaiting(devisItem.date_envoi)
                    const isUrgent = daysWaiting > 5
                    return (
                      <tr key={devisItem.id} className={isUrgent ? 'urgent' : ''}>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-medium text-zinc-100">{devisItem.client_nom}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm text-zinc-500">{devisItem.telephone || '—'}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-semibold tnum text-zinc-100">
                            {Number(devisItem.montant).toLocaleString('fr-FR')}€
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-sm text-zinc-500">
                          {new Date(devisItem.date_envoi).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className={`text-sm ${
                            daysWaiting > 3 ? 'text-red-400 font-semibold' :
                            daysWaiting >= 2 ? 'text-orange-400 font-medium' :
                            'text-green-400'
                          }`}>
                            {daysWaiting} jour{daysWaiting > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className={getStatusBadgeClasses(devisItem.statut)}>
                            {getStatusLabel(devisItem.statut)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          {devisItem.statut === 'en_attente' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateDevisStatus(devisItem.id, 'accepte', devisItem.client_nom)}
                                className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => updateDevisStatus(devisItem.id, 'refuse', devisItem.client_nom)}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                          {devisItem.statut !== 'en_attente' && (
                            <button
                              onClick={() => updateDevisStatus(devisItem.id, 'en_attente', devisItem.client_nom)}
                              className="btn-secondary text-xs"
                            >
                              Réinitialiser
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredDevis.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-zinc-600 text-sm">Aucun devis à afficher pour ce filtre</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
