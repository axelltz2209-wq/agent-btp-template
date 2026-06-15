'use client'

import { useEffect, useState } from 'react'
import { supabase, Chantier } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import companyConfig from '@/config/company'

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [filteredChantiers, setFilteredChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ heures: string; depenses: string }>({ heures: '', depenses: '' })
  const [dailyForm, setDailyForm] = useState({ chantierId: '', heures: '', depenses: '', note: '' })

  useEffect(() => {
    fetchChantiers()
    const channel = supabase
      .channel('chantiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, () => { fetchChantiers() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredChantiers(chantiers)
    } else {
      setFilteredChantiers(chantiers.filter((c) => c.statut === filterStatus))
    }
  }, [chantiers, filterStatus])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function fetchChantiers() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('chantiers').select('*').order('date_debut', { ascending: true })
      if (fetchError) throw fetchError
      setChantiers(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function updateChantierStatus(id: string, newStatus: string) {
    try {
      const { error: updateError } = await supabase.from('chantiers').update({ statut: newStatus }).eq('id', id)
      if (updateError) throw updateError
      setToast({ message: 'Statut mis à jour avec succès', type: 'success' })
      await fetchChantiers()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    }
  }

  async function updateChantierCosts(id: string, heures: number, depenses: number) {
    try {
      const { error: updateError } = await supabase
        .from('chantiers').update({ heures_travaillees: heures, depenses }).eq('id', id)
      if (updateError) throw updateError
      setToast({ message: 'Coûts mis à jour avec succès', type: 'success' })
      setEditingId(null)
      await fetchChantiers()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    }
  }

  function startEditing(chantier: Chantier) {
    setEditingId(chantier.id)
    setEditValues({ heures: String(chantier.heures_travaillees || 0), depenses: String(chantier.depenses || 0) })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditValues({ heures: '', depenses: '' })
  }

  function saveEditing(id: string) {
    updateChantierCosts(id, parseFloat(editValues.heures) || 0, parseFloat(editValues.depenses) || 0)
  }

  async function addDailyCosts() {
    if (!dailyForm.chantierId) {
      setToast({ message: 'Veuillez sélectionner un chantier', type: 'error' })
      return
    }
    const heuresAjouter = parseFloat(dailyForm.heures) || 0
    const depensesAjouter = parseFloat(dailyForm.depenses) || 0
    if (heuresAjouter === 0 && depensesAjouter === 0) {
      setToast({ message: 'Veuillez saisir des heures ou des dépenses', type: 'error' })
      return
    }
    try {
      const chantier = chantiers.find((c) => c.id === dailyForm.chantierId)
      if (!chantier) throw new Error('Chantier introuvable')
      const newHeures = (chantier.heures_travaillees || 0) + heuresAjouter
      const newDepenses = (chantier.depenses || 0) + depensesAjouter
      const { error: updateError } = await supabase
        .from('chantiers').update({ heures_travaillees: newHeures, depenses: newDepenses }).eq('id', dailyForm.chantierId)
      if (updateError) throw updateError
      setToast({ message: `Journée enregistrée : +${heuresAjouter}h, +${depensesAjouter.toLocaleString('fr-FR')}€`, type: 'success' })
      setDailyForm({ chantierId: '', heures: '', depenses: '', note: '' })
      await fetchChantiers()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erreur lors de l'enregistrement", type: 'error' })
    }
  }

  function calculateMargin(montantDevis: number, heuresTravaillees: number | null, depenses: number | null) {
    const heures = heuresTravaillees || 0
    const depensesValue = depenses || 0
    const coutTotal = heures * companyConfig.tauxHoraire + depensesValue
    const marge = montantDevis - coutTotal
    const margePct = montantDevis > 0 ? (marge / montantDevis) * 100 : 0
    return { marge, margePct }
  }

  function getMarginColor(margePct: number): string {
    if (margePct < 15) return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (margePct < 25) return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    return 'text-green-400 bg-green-500/10 border-green-500/20'
  }

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'prevu': return 'badge badge-prevu'
      case 'en_cours': return 'badge badge-encours'
      case 'termine': return 'badge badge-termine'
      default: return 'badge badge-prevu'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'prevu': return 'Prévu'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      default: return status
    }
  }

  const calculateDaysUntilStart = (dateDebut: string): number => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(dateDebut)
    start.setHours(0, 0, 0, 0)
    return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const inputStyle = "w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-600"

  if (loading && chantiers.length === 0) {
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
            <button onClick={fetchChantiers} className="mt-6 btn-primary w-full">Réessayer</button>
          </div>
        </main>
      </div>
    )
  }

  const chantiersEnCours = chantiers.filter((c) => c.statut === 'en_cours')

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
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Chantiers</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Gestion des chantiers</p>
            </div>
            <button onClick={fetchChantiers} className="btn-secondary group flex items-center gap-2">
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
              { label: 'Total Chantiers', value: chantiers.length, sub: null, color: 'text-blue-400' },
              { label: 'Prévus', value: chantiers.filter((c) => c.statut === 'prevu').length, sub: 'À venir', color: 'text-blue-400' },
              { label: 'En Cours', value: chantiers.filter((c) => c.statut === 'en_cours').length, sub: 'Actifs', color: 'text-yellow-400' },
              { label: 'Terminés', value: chantiers.filter((c) => c.statut === 'termine').length, sub: 'Complétés', color: 'text-green-400' },
            ].map((s, i) => (
              <div key={s.label} className="stat-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4">{s.label}</div>
                <div className="stat-number">{s.value}</div>
                {s.sub && <div className="text-xs text-zinc-600 mt-2">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {[
              { key: 'all', label: `Tous (${chantiers.length})` },
              { key: 'prevu', label: `Prévus (${chantiers.filter((c) => c.statut === 'prevu').length})` },
              { key: 'en_cours', label: `En cours (${chantiersEnCours.length})` },
              { key: 'termine', label: `Terminés (${chantiers.filter((c) => c.statut === 'termine').length})` },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilterStatus(f.key)} className={`filter-btn ${filterStatus === f.key ? 'filter-btn-active' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Daily Cost Form */}
          <div className="mb-8 card-btp p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Saisie quotidienne</h2>
                <p className="text-xs text-zinc-600 mt-0.5">{chantiersEnCours.length} chantier{chantiersEnCours.length !== 1 ? 's' : ''} en cours</p>
              </div>
            </div>

            {chantiersEnCours.length === 0 ? (
              <p className="text-sm text-zinc-600">Aucun chantier en cours pour le moment.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      Chantier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={dailyForm.chantierId}
                      onChange={(e) => setDailyForm({ ...dailyForm, chantierId: e.target.value })}
                      className={inputStyle}
                      style={{ background: '#18181f' }}
                    >
                      <option value="">Sélectionner...</option>
                      {chantiersEnCours.map((chantier) => (
                        <option key={chantier.id} value={chantier.id}>{chantier.client_nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Heures aujourd'hui</label>
                    <input
                      type="number" step="0.5" min="0"
                      value={dailyForm.heures}
                      onChange={(e) => setDailyForm({ ...dailyForm, heures: e.target.value })}
                      placeholder="0"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Dépenses aujourd'hui (€)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={dailyForm.depenses}
                      onChange={(e) => setDailyForm({ ...dailyForm, depenses: e.target.value })}
                      placeholder="0.00"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Note (optionnelle)</label>
                    <input
                      type="text"
                      value={dailyForm.note}
                      onChange={(e) => setDailyForm({ ...dailyForm, note: e.target.value })}
                      placeholder="Ex: Matériaux achetés..."
                      className={inputStyle}
                    />
                  </div>
                </div>

                {/* Running totals preview */}
                {dailyForm.chantierId && (() => {
                  const selectedChantier = chantiers.find((c) => c.id === dailyForm.chantierId)
                  if (!selectedChantier) return null
                  const heuresAjouter = parseFloat(dailyForm.heures) || 0
                  const depensesAjouter = parseFloat(dailyForm.depenses) || 0
                  const newHeures = (selectedChantier.heures_travaillees || 0) + heuresAjouter
                  const newDepenses = (selectedChantier.depenses || 0) + depensesAjouter
                  const { marge, margePct } = calculateMargin(selectedChantier.montant_devis, newHeures, newDepenses)

                  return (
                    <div className="flex items-center justify-between p-4 rounded-lg mb-4" style={{ background: '#18181f', border: '1px solid #27272a' }}>
                      <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div>
                          <span className="text-zinc-500">Total heures :</span>
                          <span className="ml-2 font-semibold text-zinc-100">
                            {newHeures.toFixed(1)}h
                            {heuresAjouter > 0 && <span className="ml-1 text-blue-400 font-bold">(+{heuresAjouter.toFixed(1)}h)</span>}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-zinc-800 hidden sm:block" />
                        <div>
                          <span className="text-zinc-500">Total dépenses :</span>
                          <span className="ml-2 font-semibold text-zinc-100">
                            {newDepenses.toLocaleString('fr-FR')}€
                            {depensesAjouter > 0 && <span className="ml-1 text-blue-400 font-bold">(+{depensesAjouter.toLocaleString('fr-FR')}€)</span>}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-zinc-800 hidden sm:block" />
                        <div>
                          <span className="text-zinc-500">Marge :</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold border ${getMarginColor(margePct)}`}>
                            {marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex justify-end">
                  <button
                    onClick={addDailyCosts}
                    disabled={!dailyForm.chantierId}
                    className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enregistrer la journée
                  </button>
                </div>
              </>
            )}
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
                    <th>Heures</th>
                    <th>Dépenses</th>
                    <th>Marge</th>
                    <th>Délai</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChantiers.map((chantier) => {
                    const daysUntilStart = calculateDaysUntilStart(chantier.date_debut)
                    const { marge, margePct } = calculateMargin(chantier.montant_devis, chantier.heures_travaillees, chantier.depenses)
                    const isEditing = editingId === chantier.id
                    const editInputClass = "w-20 px-2 py-1 text-sm rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"

                    return (
                      <tr key={chantier.id}>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-medium text-zinc-100">{chantier.client_nom}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm text-zinc-500">{chantier.telephone || '—'}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm font-semibold tnum text-zinc-100">
                            {Number(chantier.montant_devis).toLocaleString('fr-FR')}€
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          {isEditing ? (
                            <input type="number" value={editValues.heures} onChange={(e) => setEditValues({ ...editValues, heures: e.target.value })} className={editInputClass} placeholder="0" />
                          ) : (
                            <div className="text-sm text-zinc-400">{chantier.heures_travaillees || 0}h</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {isEditing ? (
                            <input type="number" value={editValues.depenses} onChange={(e) => setEditValues({ ...editValues, depenses: e.target.value })} className={`${editInputClass} w-24`} placeholder="0" />
                          ) : (
                            <div className="text-sm text-zinc-400">{Number(chantier.depenses || 0).toLocaleString('fr-FR')}€</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getMarginColor(margePct)}`}>
                            {marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="text-sm text-zinc-500">
                            {daysUntilStart > 0 && `Dans ${daysUntilStart} jours`}
                            {daysUntilStart === 0 && "Aujourd'hui"}
                            {daysUntilStart < 0 && `Il y a ${Math.abs(daysUntilStart)} jours`}
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className={getStatusBadgeClasses(chantier.statut)}>{getStatusLabel(chantier.statut)}</span>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEditing(chantier.id)} className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors">
                                  Enregistrer
                                </button>
                                <button onClick={cancelEditing} className="btn-secondary text-xs">Annuler</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(chantier)} className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors">
                                  Modifier
                                </button>
                                <select
                                  value={chantier.statut}
                                  onChange={(e) => updateChantierStatus(chantier.id, e.target.value)}
                                  className="px-2 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="prevu">Prévu</option>
                                  <option value="en_cours">En cours</option>
                                  <option value="termine">Terminé</option>
                                </select>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredChantiers.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-zinc-600 text-sm">Aucun chantier à afficher pour ce filtre</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
