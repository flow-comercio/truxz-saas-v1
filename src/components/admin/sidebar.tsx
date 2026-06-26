'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CalendarDays, Wrench, Users,
  DollarSign, BarChart2, Settings, LogOut,
  Package, ShoppingCart, FileText, Trophy, MessageSquare,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard',     label: 'Cockpit',       icon: LayoutDashboard },
  { href: '/admin/agendamentos',  label: 'Agenda',        icon: CalendarDays },
  { href: '/admin/os',            label: 'Ordens',        icon: Wrench },
  { href: '/admin/orcamentos',    label: 'Orçamentos',    icon: FileText },
  { href: '/admin/vendas',        label: 'PDV',           icon: ShoppingCart },
  { href: '/admin/estoque',       label: 'Estoque',       icon: Package },
  { href: '/admin/crm',           label: 'CRM',           icon: MessageSquare },
  { href: '/admin/equipe',        label: 'Equipe',        icon: Users },
  { href: '/admin/comissoes',     label: 'Comissões',     icon: Trophy },
  { href: '/admin/financeiro',    label: 'Financeiro',    icon: DollarSign },
  { href: '/admin/relatorios',    label: 'Relatórios',    icon: BarChart2 },
  { href: '/admin/configuracoes', label: 'Config',        icon: Settings },
]

const mobileNav = [
  navItems[0],
  navItems[1],
  navItems[2],
  navItems[4],
  navItems[11],
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
        style={{ background: '#0A0816', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-6"
            style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Cockpit</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={cn('nav-item', active && 'active')}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="nav-item w-full hover:text-[#FF375F]">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong safe-bottom"
        style={{ borderTop: '1px solid rgba(157,78,221,0.12)' }}>
        <div className="flex pt-2.5 pb-1">
          {mobileNav.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center gap-1 active:scale-95 transition-transform">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
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
    </>
  )
}
