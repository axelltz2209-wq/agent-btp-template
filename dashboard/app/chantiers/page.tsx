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
  const [editValues, setEditValues] = useState({ heures: '', depenses: '' })
  const [dailyForm, setDailyForm] = useState({ chantierId: '', heures: '', depenses: '', note: '' })

  useEffect(() => {
    fetchChantiers()
    const channel = supabase
      .channel('chantiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, () => fetchChantiers())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    setFilteredChantiers(filterStatus === 'all' ? chantiers : chantiers.filter((c) => c.statut === filterStatus))
  }, [chantiers, filterStatus])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }
  }, [toast])

  async function fetchChantiers() {
    try {
      setLoading(true)
      const { data, error: e } = await supabase.from('chantiers').select('*').order('date_debut', { ascending: true })
      if (e) throw e
      setChantiers(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  async function updateChantierStatus(id: string, newStatus: string) {
    try {
      const { error: e } = await supabase.from('chantiers').update({ statut: newStatus }).eq('id', id)
      if (e) throw e
      setToast({ message: 'Statut mis à jour', type: 'success' })
      await fetchChantiers()
    } catch (err) { setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' }) }
  }

  async function updateChantierCosts(id: string, heures: number, depenses: number) {
    try {
      const { error: e } = await supabase.from('chantiers').update({ heures_travaillees: heures, depenses }).eq('id', id)
      if (e) throw e
      setToast({ message: 'Coûts mis à jour', type: 'success' })
      setEditingId(null)
      await fetchChantiers()
    } catch (err) { setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' }) }
  }

  async function addDailyCosts() {
    if (!dailyForm.chantierId) { setToast({ message: 'Sélectionnez un chantier', type: 'error' }); return }
    const h = parseFloat(dailyForm.heures) || 0
    const d = parseFloat(dailyForm.depenses) || 0
    if (h === 0 && d === 0) { setToast({ message: 'Saisissez des heures ou des dépenses', type: 'error' }); return }
    try {
      const c = chantiers.find((c) => c.id === dailyForm.chantierId)
      if (!c) throw new Error('Chantier introuvable')
      const { error: e } = await supabase.from('chantiers').update({
        heures_travaillees: (c.heures_travaillees || 0) + h,
        depenses: (c.depenses || 0) + d,
      }).eq('id', dailyForm.chantierId)
      if (e) throw e
      setToast({ message: `Journée enregistrée : +${h}h, +${d.toLocaleString('fr-FR')}€`, type: 'success' })
      setDailyForm({ chantierId: '', heures: '', depenses: '', note: '' })
      await fetchChantiers()
    } catch (err) { setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' }) }
  }

  function calcMargin(montant: number, heures: number | null, depenses: number | null) {
    const h = heures || 0; const dep = depenses || 0
    const marge = montant - (h * companyConfig.tauxHoraire + dep)
    const pct = montant > 0 ? (marge / montant) * 100 : 0
    return { marge, margePct: pct }
  }

  function getMarginColor(pct: number) {
    if (pct < 15) return 'text-red-700 bg-red-50 border-red-200'
    if (pct < 25) return 'text-orange-700 bg-orange-50 border-orange-200'
    return 'text-green-700 bg-green-50 border-green-200'
  }

  const getStatusBadge = (s: string) => ({ prevu: 'badge badge-prevu', en_cours: 'badge badge-encours', termine: 'badge badge-termine' })[s as 'prevu' | 'en_cours' | 'termine'] ?? 'badge badge-prevu'
  const getStatusLabel = (s: string) => ({ prevu: 'Prévu', en_cours: 'En cours', termine: 'Terminé' })[s as 'prevu' | 'en_cours' | 'termine'] ?? s
  const calcDaysUntil = (d: string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const s = new Date(d); s.setHours(0, 0, 0, 0)
    return Math.ceil((s.getTime() - now.getTime()) / 86400000)
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
  const chantiersEnCours = chantiers.filter((c) => c.statut === 'en_cours')

  if (loading && chantiers.length === 0) {
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
            <button onClick={fetchChantiers} className="mt-6 btn-primary w-full">Réessayer</button>
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chantiers</h1>
              <p className="text-sm text-slate-400 mt-0.5">Gestion des chantiers</p>
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
              { label: 'Total Chantiers', value: chantiers.length, sub: null },
              { label: 'Prévus', value: chantiers.filter((c) => c.statut === 'prevu').length, sub: 'À venir' },
              { label: 'En Cours', value: chantiersEnCours.length, sub: 'Actifs' },
              { label: 'Terminés', value: chantiers.filter((c) => c.statut === 'termine').length, sub: 'Complétés' },
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
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Saisie quotidienne</h2>
                <p className="text-xs text-slate-400 mt-0.5">{chantiersEnCours.length} chantier{chantiersEnCours.length !== 1 ? 's' : ''} en cours</p>
              </div>
            </div>

            {chantiersEnCours.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun chantier en cours pour le moment.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Chantier <span className="text-red-500">*</span></label>
                    <select value={dailyForm.chantierId} onChange={(e) => setDailyForm({ ...dailyForm, chantierId: e.target.value })} className={inputClass}>
                      <option value="">Sélectionner...</option>
                      {chantiersEnCours.map((c) => <option key={c.id} value={c.id}>{c.client_nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Heures aujourd'hui</label>
                    <input type="number" step="0.5" min="0" value={dailyForm.heures} onChange={(e) => setDailyForm({ ...dailyForm, heures: e.target.value })} placeholder="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Dépenses (€)</label>
                    <input type="number" step="0.01" min="0" value={dailyForm.depenses} onChange={(e) => setDailyForm({ ...dailyForm, depenses: e.target.value })} placeholder="0.00" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Note (optionnelle)</label>
                    <input type="text" value={dailyForm.note} onChange={(e) => setDailyForm({ ...dailyForm, note: e.target.value })} placeholder="Ex: Matériaux..." className={inputClass} />
                  </div>
                </div>

                {dailyForm.chantierId && (() => {
                  const sel = chantiers.find((c) => c.id === dailyForm.chantierId)
                  if (!sel) return null
                  const h = (sel.heures_travaillees || 0) + (parseFloat(dailyForm.heures) || 0)
                  const d = (sel.depenses || 0) + (parseFloat(dailyForm.depenses) || 0)
                  const { marge, margePct } = calcMargin(sel.montant_devis, h, d)
                  return (
                    <div className="flex items-center justify-between p-4 rounded-lg mb-4 bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div><span className="text-slate-500">Total heures :</span><span className="ml-2 font-semibold text-slate-900">{h.toFixed(1)}h</span></div>
                        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                        <div><span className="text-slate-500">Total dépenses :</span><span className="ml-2 font-semibold text-slate-900">{d.toLocaleString('fr-FR')}€</span></div>
                        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                        <div><span className="text-slate-500">Marge :</span><span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold border ${getMarginColor(margePct)}`}>{marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)</span></div>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex justify-end">
                  <button onClick={addDailyCosts} disabled={!dailyForm.chantierId} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
                  <tr><th>Client</th><th>Téléphone</th><th>Montant</th><th>Heures</th><th>Dépenses</th><th>Marge</th><th>Délai</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredChantiers.map((c) => {
                    const days = calcDaysUntil(c.date_debut)
                    const { marge, margePct } = calcMargin(c.montant_devis, c.heures_travaillees, c.depenses)
                    const editing = editingId === c.id
                    const editInput = "w-20 px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    return (
                      <tr key={c.id}>
                        <td className="whitespace-nowrap"><div className="text-sm font-medium text-slate-900">{c.client_nom}</div></td>
                        <td className="whitespace-nowrap text-sm text-slate-400">{c.telephone || '—'}</td>
                        <td className="whitespace-nowrap"><div className="text-sm font-semibold tnum text-slate-900">{Number(c.montant_devis).toLocaleString('fr-FR')}€</div></td>
                        <td className="whitespace-nowrap">
                          {editing ? <input type="number" value={editValues.heures} onChange={(e) => setEditValues({ ...editValues, heures: e.target.value })} className={editInput} placeholder="0" />
                            : <div className="text-sm text-slate-500">{c.heures_travaillees || 0}h</div>}
                        </td>
                        <td className="whitespace-nowrap">
                          {editing ? <input type="number" value={editValues.depenses} onChange={(e) => setEditValues({ ...editValues, depenses: e.target.value })} className={`${editInput} w-24`} placeholder="0" />
                            : <div className="text-sm text-slate-500">{Number(c.depenses || 0).toLocaleString('fr-FR')}€</div>}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getMarginColor(margePct)}`}>
                            {marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-sm text-slate-500">
                          {days > 0 ? `Dans ${days} jours` : days === 0 ? "Aujourd'hui" : `Il y a ${Math.abs(days)} jours`}
                        </td>
                        <td className="whitespace-nowrap"><span className={getStatusBadge(c.statut)}>{getStatusLabel(c.statut)}</span></td>
                        <td className="whitespace-nowrap">
                          <div className="flex gap-2">
                            {editing ? (
                              <>
                                <button onClick={() => updateChantierCosts(c.id, parseFloat(editValues.heures) || 0, parseFloat(editValues.depenses) || 0)} className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">Enregistrer</button>
                                <button onClick={() => { setEditingId(null); setEditValues({ heures: '', depenses: '' }) }} className="btn-secondary text-xs">Annuler</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(c.id); setEditValues({ heures: String(c.heures_travaillees || 0), depenses: String(c.depenses || 0) }) }} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">Modifier</button>
                                <select value={c.statut} onChange={(e) => updateChantierStatus(c.id, e.target.value)} className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
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
                <div className="px-6 py-16 text-center"><p className="text-slate-400 text-sm">Aucun chantier à afficher pour ce filtre</p></div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
