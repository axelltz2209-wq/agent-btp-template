import { Devis } from '@/lib/supabase'

interface DevisTableProps {
  devis: Devis[]
}

export default function DevisTable({ devis }: DevisTableProps) {
  const getStatusBadge = (statut: string) => {
    const styles = {
      en_attente: 'badge-attente',
      accepte: 'badge-accepte',
      refuse: 'badge-refuse',
    }
    return styles[statut as keyof typeof styles] || styles.en_attente
  }

  const getStatusLabel = (statut: string) => {
    const labels = {
      en_attente: 'En attente',
      accepte: 'Accepté',
      refuse: 'Refusé',
    }
    return labels[statut as keyof typeof labels] || statut
  }

  const getDaysWaiting = (dateEnvoi: string) => {
    const now = new Date()
    const sent = new Date(dateEnvoi)
    const diffTime = Math.abs(now.getTime() - sent.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysColor = (days: number) => {
    if (days > 3) return 'text-red-400 font-semibold'
    if (days >= 2) return 'text-orange-400 font-medium'
    return 'text-green-400'
  }

  return (
    <div className="card-btp overflow-hidden fade-in">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="indicator-dot" />
          <h2 className="text-sm font-semibold text-zinc-100">Devis en attente</h2>
          {devis.length > 0 && (
            <span className="ml-auto text-xs text-zinc-600">{devis.length} devis</span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-btp">
          <thead>
            <tr>
              <th>Client</th>
              <th>Montant</th>
              <th>Attente</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {devis.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-600">
                  Aucun devis en attente
                </td>
              </tr>
            ) : (
              devis.map((d) => {
                const daysWaiting = getDaysWaiting(d.date_envoi)
                const isUrgent = daysWaiting > 5
                return (
                  <tr key={d.id} className={isUrgent ? 'urgent' : ''}>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-medium text-zinc-100">{d.client_nom}</div>
                      {d.telephone && (
                        <div className="text-xs mt-0.5 text-zinc-600">{d.telephone}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold tnum text-zinc-100">
                        {Number(d.montant).toLocaleString('fr-FR')}€
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className={`text-sm ${getDaysColor(daysWaiting)}`}>
                        {daysWaiting} jour{daysWaiting > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-zinc-500">
                      {new Date(d.date_envoi).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(d.statut)}`}>
                        {getStatusLabel(d.statut)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
