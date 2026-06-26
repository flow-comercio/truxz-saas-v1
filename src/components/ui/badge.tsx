import { cn } from '@/lib/utils'

const variants = {
  purple:  'bg-[rgba(157,78,221,0.15)] text-[#C77DFF] border border-[rgba(157,78,221,0.3)]',
  green:   'bg-[rgba(74,222,128,0.12)] text-[#4ADE80] border border-[rgba(74,222,128,0.25)]',
  amber:   'bg-[rgba(251,191,36,0.12)] text-[#FBBF24] border border-[rgba(251,191,36,0.25)]',
  red:     'bg-[rgba(248,113,113,0.12)] text-[#F87171] border border-[rgba(248,113,113,0.25)]',
  neutral: 'bg-white/[0.06] text-[#A0A0B8] border border-white/[0.08]',
  blue:    'bg-[rgba(59,130,246,0.12)] text-[#93C5FD] border border-[rgba(59,130,246,0.25)]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'neutral', className, dot = false }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
      variants[variant],
      className
    )}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  )
}
