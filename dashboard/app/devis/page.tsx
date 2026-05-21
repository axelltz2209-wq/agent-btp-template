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

    // Subscribe to real-time changes
    const channel = supabase
      .channel('devis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => {
        fetchDevis()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredDevis(devis)
    } else {
      setFilteredDevis(devis.filter((d) => d.statut === filterStatus))
    }
  }, [devis, filterStatus])

  // Auto-hide toast after 3 seconds
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
        ? `Êtes-vous sûr de vouloir accepter le devis de ${clientNom} ?`
        : newStatus === 'refuse'
        ? `Êtes-vous sûr de vouloir refuser le devis de ${clientNom} ?`
        : `Remettre le devis de ${clientNom} en attente ?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('devis')
        .update({ statut: newStatus })
        .eq('id', id)

      if (updateError) throw updateError

      // Show success toast
      setToast({
        message: `Devis ${statusLabels[newStatus as keyof typeof statusLabels]} avec succès`,
        type: 'success',
      })

      // Refresh data
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
      case 'en_attente':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700'
      case 'accepte':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700'
      case 'refuse':
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700'
      default:
        return 'px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'en_attente':
        return 'En attente'
      case 'accepte':
        return 'Accepté'
      case 'refuse':
        return 'Refusé'
      default:
        return status
    }
  }

  const calculateDaysWaiting = (dateEnvoi: string): number => {
    const now = new Date()
    const sent = new Date(dateEnvoi)
    const diffTime = Math.abs(now.getTime() - sent.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading && devis.length === 0) {
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
                onClick={fetchDevis}
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
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
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
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Devis</h1>
              <p className="text-[#6b7280] text-base">Gestion des devis clients</p>
            </div>
            <button
              onClick={fetchDevis}
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
                Total Devis
              </div>
              <div className="text-3xl font-bold text-[#111827]">{devis.length}</div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                En Attente
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {devis.filter((d) => d.statut === 'en_attente').length}
              </div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                Acceptés
              </div>
              <div className="text-3xl font-bold text-green-600">
                {devis.filter((d) => d.statut === 'accepte').length}
              </div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                Refusés
              </div>
              <div className="text-3xl font-bold text-red-600">
                {devis.filter((d) => d.statut === 'refuse').length}
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
              Tous ({devis.length})
            </button>
            <button
              onClick={() => setFilterStatus('en_attente')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'en_attente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-yellow-600'
              }`}
            >
              En attente ({devis.filter((d) => d.statut === 'en_attente').length})
            </button>
            <button
              onClick={() => setFilterStatus('accepte')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'accepte'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-green-600'
              }`}
            >
              Acceptés ({devis.filter((d) => d.statut === 'accepte').length})
            </button>
            <button
              onClick={() => setFilterStatus('refuse')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                filterStatus === 'refuse'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-red-600'
              }`}
            >
              Refusés ({devis.filter((d) => d.statut === 'refuse').length})
            </button>
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
                      Date d'envoi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Jours d'attente
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
                  {filteredDevis.map((devisItem) => (
                    <tr key={devisItem.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#111827]">
                          {devisItem.client_nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#6b7280]">
                          {devisItem.telephone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#111827]">
                          {Number(devisItem.montant).toLocaleString('fr-FR')}€
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#6b7280]">
                          {new Date(devisItem.date_envoi).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#6b7280]">
                          {calculateDaysWaiting(devisItem.date_envoi)} jours
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClasses(devisItem.statut)}>
                          {getStatusLabel(devisItem.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {devisItem.statut === 'en_attente' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateDevisStatus(devisItem.id, 'accepte', devisItem.client_nom)
                              }
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                              Accepter
                            </button>
                            <button
                              onClick={() =>
                                updateDevisStatus(devisItem.id, 'refuse', devisItem.client_nom)
                              }
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                        {devisItem.statut !== 'en_attente' && (
                          <button
                            onClick={() =>
                              updateDevisStatus(devisItem.id, 'en_attente', devisItem.client_nom)
                            }
                            className="px-3 py-1.5 text-xs font-medium text-[#6b7280] bg-white border border-[#e5e7eb] hover:border-[#111827] rounded-lg transition-all"
                          >
                            Réinitialiser
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDevis.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-[#6b7280] text-sm">
                    Aucun devis à afficher pour ce filtre
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
