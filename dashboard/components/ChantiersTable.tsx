import { Chantier } from '@/lib/supabase'

interface ChantiersTableProps {
  chantiers: Chantier[]
}

export default function ChantiersTable({ chantiers }: ChantiersTableProps) {
  const getStatusBadge = (statut: string) => {
    const styles = {
      prevu: 'badge-prevu',
      en_cours: 'badge-encours',
      termine: 'badge-termine',
    }
    return styles[statut as keyof typeof styles] || styles.prevu
  }

  const getStatusLabel = (statut: string) => {
    const labels = {
      prevu: 'Prévu',
      en_cours: 'En cours',
      termine: 'Terminé',
    }
    return labels[statut as keyof typeof labels] || statut
  }

  const getDaysUntil = (dateDebut: string) => {
    const now = new Date()
    const start = new Date(dateDebut)
    const diffTime = start.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysText = (days: number) => {
    if (days < 0) return `Démarré il y a ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Demain'
    return `Dans ${days} jours`
  }

  return (
    <div className="card-btp overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="indicator-dot" />
          <h2 className="text-sm font-semibold text-zinc-100">Chantiers à venir</h2>
          {chantiers.length > 0 && (
            <span className="ml-auto text-xs text-zinc-600">{chantiers.length} chantiers</span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-btp">
          <thead>
            <tr>
              <th>Client</th>
              <th>Montant</th>
              <th>Date de début</th>
              <th>Début dans</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {chantiers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-600">
                  Aucun chantier trouvé
                </td>
              </tr>
            ) : (
              chantiers.map((c) => {
                const daysUntil = getDaysUntil(c.date_debut)
                return (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-medium text-zinc-100">{c.client_nom}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold tnum text-zinc-100">
                        {Number(c.montant_devis).toLocaleString('fr-FR')}€
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-zinc-500">
                      {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm text-zinc-400">{getDaysText(daysUntil)}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(c.statut)}`}>
                        {getStatusLabel(c.statut)}
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
