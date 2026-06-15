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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => fetchDevis())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    setFilteredDevis(filterStatus === 'all' ? devis : devis.filter((d) => d.statut === filterStatus))
  }, [devis, filterStatus])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function fetchDevis() {
    try {
      setLoading(true)
      const { data, error: e } = await supabase.from('devis').select('*').order('date_envoi', { ascending: false })
      if (e) throw e
      setDevis(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function updateDevisStatus(id: string, newStatus: string, clientNom: string) {
    const labels = { accepte: 'accepté', refuse: 'refusé', en_attente: 'remis en attente' }
    const msg = newStatus === 'accepte' ? `Accepter le devis de ${clientNom} ?`
      : newStatus === 'refuse' ? `Refuser le devis de ${clientNom} ?`
      : `Remettre le devis de ${clientNom} en attente ?`
    if (!window.confirm(msg)) return
    try {
      const { error: e } = await supabase.from('devis').update({ statut: newStatus }).eq('id', id)
      if (e) throw e
      setToast({ message: `Devis ${labels[newStatus as keyof typeof labels]} avec succès`, type: 'success' })
      await fetchDevis()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    }
  }

  const getStatusBadgeClasses = (s: string) => ({
    en_attente: 'badge badge-attente', accepte: 'badge badge-accepte', refuse: 'badge badge-refuse',
  })[s as 'en_attente' | 'accepte' | 'refuse'] ?? 'badge badge-attente'

  const getStatusLabel = (s: string) => ({
    en_attente: 'En attente', accepte: 'Accepté', refuse: 'Refusé',
  })[s as 'en_attente' | 'accepte' | 'refuse'] ?? s

  const calcDays = (d: string) => Math.ceil(Math.abs(new Date().getTime() - new Date(d).getTime()) / 86400000)

  if (loading && devis.length === 0) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 ml-[240px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Chargement...</p>
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
            <h3 className="text-red-600 font-semibold text-base mb-2">Erreur de connexion</h3>
            <p className="text-slate-500 text-sm">{error}</p>
            <button onClick={fetchDevis} className="mt-6 btn-primary w-full">Réessayer</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 fade-in">
            <div className={`px-5 py-3.5 rounded-lg shadow-md flex items-center gap-3 text-sm font-medium border ${
              toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {toast.type === 'success'
                ? <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                : <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              }
              {toast.message}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header px-8 py-6 slide-in-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Devis</h1>
              <p className="text-sm text-slate-400 mt-0.5">Gestion des devis clients</p>
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
            {[
              { label: 'Total Devis', value: devis.length, sub: null },
              { label: 'En Attente', value: devis.filter((d) => d.statut === 'en_attente').length, sub: 'Action requise' },
              { label: 'Acceptés', value: devis.filter((d) => d.statut === 'accepte').length, sub: 'Validés' },
              { label: 'Refusés', value: devis.filter((d) => d.statut === 'refuse').length, sub: 'Non acceptés' },
            ].map((s, i) => (
              <div key={s.label} className="stat-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{s.label}</div>
                <div className="stat-number">{s.value}</div>
                {s.sub && <div className="text-xs text-slate-400 mt-2">{s.sub}</div>}
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
              <button key={f.key} onClick={() => setFilterStatus(f.key)} className={`filter-btn ${filterStatus === f.key ? 'filter-btn-active' : ''}`}>
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
                    <th>Client</th><th>Téléphone</th><th>Montant</th><th>Date d'envoi</th><th>Jours d'attente</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevis.map((d) => {
                    const days = calcDays(d.date_envoi)
                    return (
                      <tr key={d.id} className={days > 5 ? 'urgent' : ''}>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{d.client_nom}</div>
                        </td>
                        <td className="whitespace-nowrap text-sm text-slate-400">{d.telephone || '—'}</td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-semibold tnum text-slate-900">{Number(d.montant).toLocaleString('fr-FR')}€</div>
                        </td>
                        <td className="whitespace-nowrap text-sm text-slate-400">
                          {new Date(d.date_envoi).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className={`text-sm ${days > 3 ? 'text-red-600 font-semibold' : days >= 2 ? 'text-orange-600 font-medium' : 'text-green-600'}`}>
                            {days} jour{days > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className={getStatusBadgeClasses(d.statut)}>{getStatusLabel(d.statut)}</span>
                        </td>
                        <td className="whitespace-nowrap">
                          {d.statut === 'en_attente' ? (
                            <div className="flex gap-2">
                              <button onClick={() => updateDevisStatus(d.id, 'accepte', d.client_nom)} className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">Accepter</button>
                              <button onClick={() => updateDevisStatus(d.id, 'refuse', d.client_nom)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">Refuser</button>
                            </div>
                          ) : (
                            <button onClick={() => updateDevisStatus(d.id, 'en_attente', d.client_nom)} className="btn-secondary text-xs">Réinitialiser</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredDevis.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-slate-400 text-sm">Aucun devis à afficher pour ce filtre</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
