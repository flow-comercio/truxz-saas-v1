import { db } from '@/db'
import { lojas, pagamentos, agendamentos } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { Gauge, Fuel, Flag, Store, TrendingUp, Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { StatCard, GlassCard } from '@/components/ui/glass-card'

export default async function MasterDashboard() {
  const [totalLojas, lojasAtivas, receitaTotal, totalAgendamentos] = await Promise.all([
    db.select({ count: count() }).from(lojas),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` }).from(pagamentos).where(eq(pagamentos.status, 'pago')),
    db.select({ count: count() }).from(agendamentos),
  ])

  const boxes = totalLojas[0].count
  const boxesAtivos = lojasAtivas[0].count
  const taxaAtivacao = boxes > 0 ? Math.round((boxesAtivos / boxes) * 100) : 0

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── HERO CAMPEONATO ─────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden carbon-bg"
        style={{ border: '1px solid rgba(220,0,0,0.2)' }}>
        {/* chequered topo */}
        <div className="absolute top-0 left-0 right-0 h-2 checkers-stripe opacity-50" />
        <div className="absolute top-2 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

        <div className="relative p-5 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#DC0000' }}>
                TRUXZ · CHAMPIONSHIP
              </p>
              <h1 className="text-2xl font-black text-white font-display tracking-wider">Central do Campeonato</h1>
              <p className="text-xs mt-1 font-racing" style={{ color: '#55556A' }}>Visão geral de todos os circuitos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #DC0000, #7B0000)', boxShadow: '0 0 28px rgba(220,0,0,0.45)' }}>
              <Flag className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* taxa de ativação */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5 font-racing">
              <span style={{ color: '#A0A0B8' }}>Boxes Ativos no Campeonato</span>
              <span style={{ color: '#DC0000' }}>{taxaAtivacao}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${taxaAtivacao}%`, background: 'linear-gradient(90deg, #DC0000, #FF8700)' }} />
            </div>
            <p className="text-[10px] font-racing mt-1" style={{ color: '#55556A' }}>
              {boxesAtivos} de {boxes} boxes em operação
            </p>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Boxes no Grid" value={boxes}
          icon={<Store className="w-5 h-5" />} color="purple" />
        <StatCard label="Boxes Ativos" value={boxesAtivos}
          icon={<Gauge className="w-5 h-5" />} color="green" />
        <StatCard label="Receita Total" value={formatCurrency(parseFloat(receitaTotal[0]?.total || '0'))}
          icon={<Fuel className="w-5 h-5" />} color="orange" />
        <StatCard label="Corridas Realizadas" value={totalAgendamentos[0].count}
          icon={<Flag className="w-5 h-5" />} color="racing" />
      </div>

      {/* ── CONTROLE DO GRID ─────────────────────── */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #DC0000, #FF8700)' }} />
          <h3 className="font-bold text-white font-display tracking-wider text-sm">Controle do Grid</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Gerenciar Boxes',     href: '/master/lojas',     icon: Store,      color: '#9D4EDD' },
            { label: 'Financeiro Geral',    href: '/master/financeiro', icon: BarChart3,  color: '#4ADE80' },
            { label: 'Planos & Categorias', href: '/master/planos',    icon: TrendingUp, color: '#FF8700' },
            { label: 'Adicionar Box',       href: '/master/lojas/nova', icon: Plus,       color: '#DC0000' },
          ].map(a => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}
                className="quick-action flex items-center gap-3 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                  <Icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <span className="text-sm font-semibold font-racing" style={{ color: '#A0A0B8' }}>{a.label}</span>
              </Link>
            )
          })}
        </div>
      </GlassCard>

    </div>
  )
}
