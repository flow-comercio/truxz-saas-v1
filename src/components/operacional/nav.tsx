'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListChecks, ScanLine, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/operacional/fila',    label: 'Fila',     icon: ListChecks },
  { href: '/operacional/checkin', label: 'Check-in', icon: ScanLine },
  { href: '/operacional/servico', label: 'Serviço',  icon: Wrench },
]

export function OperacionalNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong safe-bottom"
      style={{ borderTop: '1px solid rgba(157,78,221,0.12)' }}>
      <div className="flex pt-2.5 pb-1">
        {nav.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                active ? 'bg-[rgba(157,78,221,0.2)]' : '')}>
                <Icon className={cn('w-5 h-5', active ? 'text-brand' : 'text-white/25')}
                  strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={cn('text-[8px] font-black uppercase tracking-wider',
                active ? 'text-brand-light' : 'text-white/25')}>{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-brand" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
