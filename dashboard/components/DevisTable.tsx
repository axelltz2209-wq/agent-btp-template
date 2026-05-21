import { Devis } from '@/lib/supabase'

interface DevisTableProps {
  devis: Devis[]
}

export default function DevisTable({ devis }: DevisTableProps) {
  const getStatusBadge = (statut: string) => {
    const styles = {
      en_attente: 'badge badge-amber',
      accepte: 'badge badge-emerald',
      refuse: 'badge bg-[var(--color-error)] bg-opacity-10 text-[var(--color-error)]',
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysColor = (days: number) => {
    if (days > 3) return 'text-red-600 font-semibold'
    if (days >= 2) return 'text-amber-600 font-medium'
    return 'text-green-600'
  }

  return (
    <div className="card-premium overflow-hidden scale-in">
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-amber)' }}></div>
          <h2 className="text-xl font-bold" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)'
          }}>
            Devis en attente
          </h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-premium">
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
                <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Aucun devis en attente
                </td>
              </tr>
            ) : (
              devis.map((d) => {
                const daysWaiting = getDaysWaiting(d.date_envoi)
                const isUrgent = daysWaiting > 5
                return (
                  <tr
                    key={d.id}
                    className={isUrgent ? 'border-l-[3px]' : ''}
                    style={isUrgent ? { borderLeftColor: 'var(--color-error)' } : {}}
                  >
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {d.client_nom}
                      </div>
                      {d.telephone && (
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          {d.telephone}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold tnum" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(d.montant).toLocaleString('fr-FR')}€
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className={`text-sm ${getDaysColor(daysWaiting)}`}>
                        {daysWaiting} jour{daysWaiting > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(d.date_envoi).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={getStatusBadge(d.statut)}>
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
