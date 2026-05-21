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
  const [editValues, setEditValues] = useState<{ heures: string; depenses: string }>({
    heures: '',
    depenses: '',
  })

  // Daily cost input state
  const [dailyForm, setDailyForm] = useState({
    chantierId: '',
    heures: '',
    depenses: '',
    note: '',
  })

  useEffect(() => {
    fetchChantiers()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('chantiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, () => {
        fetchChantiers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredChantiers(chantiers)
    } else {
      setFilteredChantiers(chantiers.filter((c) => c.statut === filterStatus))
    }
  }, [chantiers, filterStatus])

  // Auto-hide toast after 3 seconds
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
        .from('chantiers')
        .select('*')
        .order('date_debut', { ascending: true })

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
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({ statut: newStatus })
        .eq('id', id)

      if (updateError) throw updateError

      setToast({
        message: `Statut mis à jour avec succès`,
        type: 'success',
      })

      // Refresh data
      await fetchChantiers()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        type: 'error',
      })
    }
  }

  async function updateChantierCosts(id: string, heures: number, depenses: number) {
    try {
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({ heures_travaillees: heures, depenses: depenses })
        .eq('id', id)

      if (updateError) throw updateError

      setToast({
        message: `Coûts mis à jour avec succès`,
        type: 'success',
      })

      setEditingId(null)
      await fetchChantiers()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        type: 'error',
      })
    }
  }

  function startEditing(chantier: Chantier) {
    setEditingId(chantier.id)
    setEditValues({
      heures: String(chantier.heures_travaillees || 0),
      depenses: String(chantier.depenses || 0),
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditValues({ heures: '', depenses: '' })
  }

  function saveEditing(id: string) {
    const heures = parseFloat(editValues.heures) || 0
    const depenses = parseFloat(editValues.depenses) || 0
    updateChantierCosts(id, heures, depenses)
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
      // Get current chantier data
      const chantier = chantiers.find((c) => c.id === dailyForm.chantierId)
      if (!chantier) throw new Error('Chantier introuvable')

      // Calculate new totals (add to existing)
      const newHeures = (chantier.heures_travaillees || 0) + heuresAjouter
      const newDepenses = (chantier.depenses || 0) + depensesAjouter

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({
          heures_travaillees: newHeures,
          depenses: newDepenses,
        })
        .eq('id', dailyForm.chantierId)

      if (updateError) throw updateError

      setToast({
        message: `✅ Journée enregistrée : +${heuresAjouter}h, +${depensesAjouter.toLocaleString('fr-FR')}€`,
        type: 'success',
      })

      // Reset form
      setDailyForm({
        chantierId: '',
        heures: '',
        depenses: '',
        note: '',
      })

      await fetchChantiers()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement',
        type: 'error',
      })
    }
  }

  function calculateMargin(
    montantDevis: number,
    heuresTravaillees: number | null,
    depenses: number | null
  ): { marge: number; margePct: number } {
    const heures = heuresTravaillees || 0
    const depensesValue = depenses || 0
    const coutMainOeuvre = heures * companyConfig.tauxHoraire
    const coutTotal = coutMainOeuvre + depensesValue
    const marge = montantDevis - coutTotal
    const margePct = montantDevis > 0 ? (marge / montantDevis) * 100 : 0
    return { marge, margePct }
  }

  function getMarginColor(margePct: number): string {
    if (margePct < 15) return 'text-red-600 bg-red-50'
    if (margePct < 25) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'prevu':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700'
      case 'en_cours':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700'
      case 'termine':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700'
      default:
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'prevu':
        return 'Prévu'
      case 'en_cours':
        return 'En cours'
      case 'termine':
        return 'Terminé'
      default:
        return status
    }
  }

  const calculateDaysUntilStart = (dateDebut: string): number => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(dateDebut)
    start.setHours(0, 0, 0, 0)
    const diffTime = start.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading && chantiers.length === 0) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <main className="flex-1 ml-[220px]">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
              <p className="text-[#6b7280] text-sm">Chargement...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <main className="flex-1 ml-[220px]">
          <div className="flex items-center justify-center h-screen">
            <div className="max-w-md bg-white border border-[#e5e7eb] rounded-lg p-8">
              <h3 className="text-red-600 font-semibold text-lg mb-3">Erreur de connexion</h3>
              <p className="text-[#6b7280] text-sm">{error}</p>
              <button
                onClick={fetchChantiers}
                className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-150 ease-in-out"
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
    <div className="min-h-screen bg-white flex">
      <Sidebar />

      <main className="flex-1 ml-[220px]">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div
              className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-[#f3f4f6] bg-white px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Chantiers</h1>
              <p className="text-[#6b7280] text-base">Gestion des chantiers</p>
            </div>
            <button
              onClick={fetchChantiers}
              className="group px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] border border-[#e5e7eb] rounded-lg hover:border-[#111827] transition-all duration-150 ease-in-out flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ease-in-out"
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
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                Total Chantiers
              </div>
              <div className="text-3xl font-bold text-[#111827]">{chantiers.length}</div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                Prévus
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {chantiers.filter((c) => c.statut === 'prevu').length}
              </div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                En Cours
              </div>
              <div className="text-3xl font-bold text-green-600">
                {chantiers.filter((c) => c.statut === 'en_cours').length}
              </div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                Terminés
              </div>
              <div className="text-3xl font-bold text-gray-600">
                {chantiers.filter((c) => c.statut === 'termine').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'all'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#2563eb]'
              }`}
            >
              Tous ({chantiers.length})
            </button>
            <button
              onClick={() => setFilterStatus('prevu')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'prevu'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-blue-600'
              }`}
            >
              Prévus ({chantiers.filter((c) => c.statut === 'prevu').length})
            </button>
            <button
              onClick={() => setFilterStatus('en_cours')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'en_cours'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-green-600'
              }`}
            >
              En cours ({chantiers.filter((c) => c.statut === 'en_cours').length})
            </button>
            <button
              onClick={() => setFilterStatus('termine')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'termine'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-gray-600'
              }`}
            >
              Terminés ({chantiers.filter((c) => c.statut === 'termine').length})
            </button>
          </div>

          {/* Daily Cost Input Form */}
          <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Saisie quotidienne</h2>
              <span className="text-sm text-gray-600">
                ({chantiers.filter((c) => c.statut === 'en_cours').length} chantier
                {chantiers.filter((c) => c.statut === 'en_cours').length > 1 ? 's' : ''} en cours)
              </span>
            </div>

            {chantiers.filter((c) => c.statut === 'en_cours').length === 0 ? (
              <p className="text-gray-600 text-sm">Aucun chantier en cours pour le moment.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Chantier Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Chantier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={dailyForm.chantierId}
                      onChange={(e) => setDailyForm({ ...dailyForm, chantierId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      {chantiers
                        .filter((c) => c.statut === 'en_cours')
                        .map((chantier) => (
                          <option key={chantier.id} value={chantier.id}>
                            {chantier.client_nom}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Heures */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Heures aujourd'hui
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={dailyForm.heures}
                      onChange={(e) => setDailyForm({ ...dailyForm, heures: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Depenses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Dépenses aujourd'hui (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dailyForm.depenses}
                      onChange={(e) => setDailyForm({ ...dailyForm, depenses: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Note (optionnelle)
                    </label>
                    <input
                      type="text"
                      value={dailyForm.note}
                      onChange={(e) => setDailyForm({ ...dailyForm, note: e.target.value })}
                      placeholder="Ex: Matériaux achetés..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Running Totals if chantier selected */}
                {dailyForm.chantierId && (() => {
                  const selectedChantier = chantiers.find((c) => c.id === dailyForm.chantierId)
                  if (!selectedChantier) return null

                  const heuresAjouter = parseFloat(dailyForm.heures) || 0
                  const depensesAjouter = parseFloat(dailyForm.depenses) || 0

                  const newHeures = (selectedChantier.heures_travaillees || 0) + heuresAjouter
                  const newDepenses = (selectedChantier.depenses || 0) + depensesAjouter

                  const { marge, margePct } = calculateMargin(
                    selectedChantier.montant_devis,
                    newHeures,
                    newDepenses
                  )

                  return (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 mb-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Total heures :</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {newHeures.toFixed(1)}h
                            {heuresAjouter > 0 && (
                              <span className="ml-1 text-blue-600">
                                (+{heuresAjouter.toFixed(1)}h)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">Total dépenses :</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {newDepenses.toLocaleString('fr-FR')}€
                            {depensesAjouter > 0 && (
                              <span className="ml-1 text-blue-600">
                                (+{depensesAjouter.toLocaleString('fr-FR')}€)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div>
                          <span className="text-gray-600">Marge actuelle :</span>
                          <span
                            className={`ml-2 px-2.5 py-1 rounded-md text-xs font-bold ${getMarginColor(margePct)}`}
                          >
                            {marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={addDailyCosts}
                    disabled={!dailyForm.chantierId}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-150 flex items-center gap-2"
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
          <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Heures
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Dépenses
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Marge
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Délai
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredChantiers.map((chantier) => {
                    const daysUntilStart = calculateDaysUntilStart(chantier.date_debut)
                    const { marge, margePct } = calculateMargin(
                      chantier.montant_devis,
                      chantier.heures_travaillees,
                      chantier.depenses
                    )
                    const isEditing = editingId === chantier.id

                    return (
                      <tr key={chantier.id} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#111827]">
                            {chantier.client_nom}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#6b7280]">
                            {chantier.telephone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-[#111827]">
                            {Number(chantier.montant_devis).toLocaleString('fr-FR')}€
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.heures}
                              onChange={(e) =>
                                setEditValues({ ...editValues, heures: e.target.value })
                              }
                              className="w-20 px-2 py-1 text-sm border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                              placeholder="0"
                            />
                          ) : (
                            <div className="text-sm text-[#6b7280]">
                              {chantier.heures_travaillees || 0}h
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.depenses}
                              onChange={(e) =>
                                setEditValues({ ...editValues, depenses: e.target.value })
                              }
                              className="w-24 px-2 py-1 text-sm border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                              placeholder="0"
                            />
                          ) : (
                            <div className="text-sm text-[#6b7280]">
                              {Number(chantier.depenses || 0).toLocaleString('fr-FR')}€
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getMarginColor(margePct)}`}
                          >
                            {marge.toLocaleString('fr-FR')}€ ({margePct.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#6b7280]">
                            {daysUntilStart > 0 && `Dans ${daysUntilStart} jours`}
                            {daysUntilStart === 0 && "Aujourd'hui"}
                            {daysUntilStart < 0 && `Il y a ${Math.abs(daysUntilStart)} jours`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeClasses(chantier.statut)}>
                            {getStatusLabel(chantier.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEditing(chantier.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                  Enregistrer
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1.5 text-xs font-medium text-[#6b7280] bg-white border border-[#e5e7eb] hover:border-[#111827] rounded-lg transition-all"
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(chantier)}
                                  className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-lg transition-colors"
                                >
                                  Modifier coûts
                                </button>
                                <select
                                  value={chantier.statut}
                                  onChange={(e) =>
                                    updateChantierStatus(chantier.id, e.target.value)
                                  }
                                  className="px-3 py-1.5 text-xs font-medium text-[#111827] bg-white border border-[#e5e7eb] hover:border-[#2563eb] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
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
                <div className="px-6 py-12 text-center">
                  <p className="text-[#6b7280] text-sm">
                    Aucun chantier à afficher pour ce filtre
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
