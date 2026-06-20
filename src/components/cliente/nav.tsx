'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Clock, User, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/cliente',           label: 'Início',    icon: Home },
  { href: '/cliente/agendar',   label: 'Agendar',   icon: CalendarDays },
  { href: '/cliente/veiculos',  label: 'Veículos',  icon: Car },
  { href: '/cliente/historico', label: 'Histórico', icon: Clock },
  { href: '/cliente/perfil',    label: 'Perfil',    icon: User },
]

export function ClienteNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
      <div className="flex">
        {nav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                active ? 'text-orange-600' : 'text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
