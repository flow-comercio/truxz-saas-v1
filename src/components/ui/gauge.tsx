'use client'

interface GaugeProps {
  value: number
  max?: number
  size?: number
  label?: string
  unit?: string
  sub?: string
  color?: 'purple' | 'pink' | 'blue' | 'green'
}

const colors = {
  purple: ['#9D4EDD', '#FF375F'],
  pink:   ['#FF375F', '#FF9F0A'],
  blue:   ['#3F8EFF', '#C77DFF'],
  green:  ['#34C759', '#30D158'],
}

export function Gauge({ value, max = 100, size = 200, label, unit, sub, color = 'purple' }: GaugeProps) {
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = circ * (1 - pct)
  const [c1, c2] = colors[color]
  const id = `g-${color}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={size*0.08} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={size*0.08}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          filter={`url(#${id}-glow)`}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-black text-white leading-none" style={{ fontSize: size*0.2 }}>{value}</span>
        {unit && <span className="font-black text-white/35 uppercase tracking-widest mt-1" style={{ fontSize: size*0.05 }}>{unit}</span>}
        {sub && <span className="font-bold text-brand-light mt-1.5" style={{ fontSize: size*0.055 }}>{sub}</span>}
      </div>
    </div>
  )
}
