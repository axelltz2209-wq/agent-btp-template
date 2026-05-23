'use client'

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function SparklineChart({
  data,
  width = 120,
  height = 30,
  color = '#f97316',
}: SparklineChartProps) {
  if (data.length === 0) {
    return <div className="w-[120px] h-[30px]" />
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  // Generate SVG path points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  // Create smooth curve path
  const pathData = points.length > 0 ? `M ${points.join(' L ')}` : ''

  // Create area fill path
  const areaPath =
    points.length > 0
      ? `${pathData} L ${width},${height} L 0,${height} Z`
      : ''

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.3))' }}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#gradient-${color})`}
        className="transition-all duration-300"
      />

      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* Dots at data points */}
      {points.map((point, index) => {
        const [x, y] = point.split(',').map(Number)
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={color}
            className="transition-all duration-300"
          />
        )
      })}
    </svg>
  )
}
