'use client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
}

export function GlassCard({ children, className, glow = false, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        'bg-white/[0.03] backdrop-blur-xl',
        'border-[rgba(157,78,221,0.15)]',
        hover && 'hover:border-[rgba(157,78,221,0.35)] transition-all duration-300 hover:-translate-y-1',
        glow && 'shadow-[0_0_40px_rgba(157,78,221,0.1)]',
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(157,78,221,0.5)] to-transparent" />
      {children}
    </motion.div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'purple',
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  color?: 'purple' | 'green' | 'amber' | 'red' | 'racing' | 'orange'
}) {
  const colors = {
    purple:  'bg-[rgba(157,78,221,0.1)] border-[rgba(157,78,221,0.2)] text-[#C77DFF]',
    green:   'bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.2)] text-[#4ADE80]',
    amber:   'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.2)] text-[#FBBF24]',
    red:     'bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)] text-[#F87171]',
    racing:  'bg-[rgba(220,0,0,0.1)] border-[rgba(220,0,0,0.3)] text-[#FF4444]',
    orange:  'bg-[rgba(255,135,0,0.1)] border-[rgba(255,135,0,0.3)] text-[#FF8700]',
  }

  return (
    <GlassCard glow>
      <div className="p-5">
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center mb-3', colors[color])}>
            {icon}
          </div>
        )}
        <p className="text-2xl font-black text-white mb-0.5">{value}</p>
        <p className="text-xs font-semibold text-[#55556A] uppercase tracking-wider">{label}</p>
        {sub && <p className={cn('text-xs font-bold mt-1', colors[color].split(' ').pop())}>{sub}</p>}
      </div>
    </GlassCard>
  )
}
