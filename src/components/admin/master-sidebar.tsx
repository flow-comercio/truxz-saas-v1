'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Store, DollarSign, Package, LogOut, Car, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/master/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/master/lojas',     label: 'Lojas',     icon: Store },
  { href: '/master/financeiro',label: 'Financeiro', icon: DollarSign },
  { href: '/master/planos',    label: 'Planos',     icon: Package },
]

export function MasterSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
          <Car className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">TRUXZ</p>
          <p className="text-xs text-orange-600 font-semibold">MASTER</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
        <NavContent />
      </aside>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-sm">TRUXZ <span className="text-orange-600">Master</span></span>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 h-full bg-white flex flex-col shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
