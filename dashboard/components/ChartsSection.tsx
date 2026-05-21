import { Devis, Chantier } from '@/lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartsSectionProps {
  devis: Devis[]
  chantiers: Chantier[]
}

export default function ChartsSection({ devis, chantiers }: ChartsSectionProps) {
  // Prepare data for line chart - Evolution des relances (last 30 days)
  const getLast30DaysData = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Create array of last 30 days
    const days: { date: string; count: number }[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + i)
      days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count: 0,
      })
    }

    // Count devis per day
    devis.forEach((d) => {
      const devisDate = new Date(d.date_envoi)
      if (devisDate >= thirtyDaysAgo && devisDate <= today) {
        const dayIndex = Math.floor((devisDate.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24))
        if (dayIndex >= 0 && dayIndex < 30) {
          days[dayIndex].count++
        }
      }
    })

    return days
  }

  // Prepare data for bar chart - CA previsionnel (next 4 weeks)
  const getNext4WeeksCA = () => {
    const today = new Date()
    const weeks: { week: string; ca: number }[] = []

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      let weekCA = 0
      chantiers.forEach((c) => {
        const startDate = new Date(c.date_debut)
        if (startDate >= weekStart && startDate <= weekEnd) {
          weekCA += Number(c.montant_devis)
        }
      })

      weeks.push({
        week: `S${i + 1}`,
        ca: weekCA,
      })
    }

    return weeks
  }

  const relancesData = getLast30DaysData()
  const caData = getNext4WeeksCA()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart - Evolution des relances */}
      <div className="chart-container scale-in">
        <div className="mb-6">
          <h3 className="chart-title">
            Évolution des relances
          </h3>
          <p className="chart-description">
            Nombre de devis envoyés par jour (30 derniers jours)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={relancesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.5} />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - CA previsionnel */}
      <div className="chart-container scale-in" style={{ animationDelay: '0.1s' }}>
        <div className="mb-6">
          <h3 className="chart-title">
            Chiffre d'affaires prévisionnel
          </h3>
          <p className="chart-description">
            Revenus prévus par semaine (4 prochaines semaines)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={caData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.5} />
            <XAxis dataKey="week" stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
            />
            <Bar dataKey="ca" fill="#2563eb" radius={[8, 8, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
