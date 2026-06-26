'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Gauge, Flag, Fuel, Trophy, LogOut, Menu, X, Store } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/master/dashboard',  label: 'Central',      icon: Gauge,   desc: 'Campeonato' },
  { href: '/master/lojas',      label: 'Boxes',        icon: Store,   desc: 'Circuitos' },
  { href: '/master/financeiro', label: 'Financeiro',   icon: Fuel,    desc: 'Receitas' },
  { href: '/master/planos',     label: 'Planos',       icon: Trophy,  desc: 'Categorias' },
]

const RED    = '#DC0000'
const CARBON = '#0A0A0F'

export function MasterSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full">

      {/* ── LOGO CHAMPIONSHIP ────────────────────── */}
      <div className="relative px-4 py-4 flex-shrink-0 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(220,0,0,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-1.5 checkers-stripe opacity-70" />
        <div className="absolute top-1.5 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #DC0000, #FF8700 50%, #DC0000)' }} />

        <div className="mt-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 20px rgba(220,0,0,0.45)' }}>
            <Flag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm font-display tracking-[0.18em]">TRUXZ</p>
            <p className="text-[10px] font-racing uppercase tracking-[3px]" style={{ color: '#FFD700' }}>
              Championship
            </p>
          </div>
        </div>
      </div>

      {/* ── NAV ──────────────────────────────────── */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold font-racing transition-all"
              style={{
                background: active ? 'rgba(220,0,0,0.1)' : 'transparent',
                borderLeft: active ? `3px solid ${RED}` : '3px solid transparent',
              }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: active ? 'rgba(220,0,0,0.15)' : 'rgba(255,255,255,0.03)',
                  border: active ? '1px solid rgba(220,0,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}>
                <Icon className="w-4 h-4" style={{ color: active ? RED : '#3A3A4A' }} strokeWidth={active ? 2.5 : 2} />
              </div>
              <div>
                <p style={{ color: active ? '#FF6666' : '#55556A' }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: active ? 'rgba(220,0,0,0.6)' : '#2A2A3A' }}>{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* ── LOGOUT ───────────────────────────────── */}
      <div className="p-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(220,0,0,0.1)' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold font-racing transition-all"
          style={{ color: '#3A3A4A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3A3A4A'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <LogOut className="w-4 h-4" />
          Sair do Campeonato
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
        style={{ background: CARBON, borderRight: '1px solid rgba(220,0,0,0.12)' }}>
        <NavContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 h-14 flex items-center justify-between overflow-hidden"
        style={{ background: CARBON, borderBottom: '1px solid rgba(220,0,0,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-60" />
        <div className="absolute top-1 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />

        <div className="relative flex items-center gap-2 mt-0.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 12px rgba(220,0,0,0.4)' }}>
            <Flag className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-black text-white text-sm font-display tracking-widest">TRUXZ</span>
            <span className="ml-2 text-[10px] font-racing" style={{ color: '#FFD700' }}>CHAMPIONSHIP</span>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="relative p-2 rounded-lg" style={{ color: '#55556A' }}>
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col shadow-2xl"
            style={{ background: CARBON, borderRight: '1px solid rgba(220,0,0,0.2)' }}>
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg z-10"
              style={{ color: '#55556A', background: 'rgba(255,255,255,0.04)' }}>
              <X className="w-4 h-4" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
