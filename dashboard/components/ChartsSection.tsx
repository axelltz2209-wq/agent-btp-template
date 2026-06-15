import { Devis, Chantier } from '@/lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartsSectionProps {
  devis: Devis[]
  chantiers: Chantier[]
}

const DARK_TOOLTIP_STYLE = {
  backgroundColor: '#18181f',
  border: '1px solid #27272a',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
  fontFamily: 'Inter',
  color: '#f4f4f5',
}

export default function ChartsSection({ devis, chantiers }: ChartsSectionProps) {
  const getLast30DaysData = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const days: { date: string; count: number }[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + i)
      days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count: 0,
      })
    }

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

      weeks.push({ week: `S${i + 1}`, ca: weekCA })
    }

    return weeks
  }

  const relancesData = getLast30DaysData()
  const caData = getNext4WeeksCA()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Line Chart */}
      <div className="chart-container fade-in">
        <div className="mb-5">
          <h3 className="chart-title">Évolution des relances</h3>
          <p className="chart-description">Devis envoyés par jour (30 derniers jours)</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={relancesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#52525b"
              tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#52525b' }}
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#52525b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={DARK_TOOLTIP_STYLE} cursor={{ stroke: '#3f3f46' }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#3B82F6', strokeWidth: 0 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="chart-container fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="mb-5">
          <h3 className="chart-title">Chiffre d'affaires prévisionnel</h3>
          <p className="chart-description">Revenus prévus par semaine (4 prochaines semaines)</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={caData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.6} />
            <XAxis
              dataKey="week"
              stroke="#52525b"
              tick={{ fontSize: 11, fontFamily: 'Inter', fill: '#52525b' }}
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#52525b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={DARK_TOOLTIP_STYLE}
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              formatter={(value) => [`${Number(value).toLocaleString('fr-FR')}€`, 'CA']}
            />
            <Bar
              dataKey="ca"
              fill="#3B82F6"
              fillOpacity={0.85}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
