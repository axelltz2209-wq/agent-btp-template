import { Chantier } from '@/lib/supabase'

interface ChantiersTableProps {
  chantiers: Chantier[]
}

export default function ChantiersTable({ chantiers }: ChantiersTableProps) {
  const getStatusBadge = (statut: string) => {
    const styles = {
      prevu: 'badge badge-blue',
      en_cours: 'badge badge-purple',
      termine: 'badge badge-emerald',
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysText = (days: number) => {
    if (days < 0) return `Démarré il y a ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Demain'
    return `Dans ${days} jours`
  }

  return (
    <div className="card-premium overflow-hidden scale-in" style={{ animationDelay: '0.1s' }}>
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="accent-dot" style={{ backgroundColor: 'var(--color-accent-purple)' }}></div>
          <h2 className="text-xl font-bold" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)'
          }}>
            Chantiers à venir
          </h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-premium">
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
                <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Aucun chantier trouvé
                </td>
              </tr>
            ) : (
              chantiers.map((c) => {
                const daysUntil = getDaysUntil(c.date_debut)
                return (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {c.client_nom}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-semibold tnum" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(c.montant_devis).toLocaleString('fr-FR')}€
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        {getDaysText(daysUntil)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={getStatusBadge(c.statut)}>
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
