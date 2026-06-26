import { db } from '@/db'
import { lojas, pagamentos, agendamentos } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { Flag, Store, TrendingUp, Plus, BarChart3, Activity } from 'lucide-react'
import Link from 'next/link'
import { Gauge } from '@/components/ui/gauge'

export default async function MasterDashboard() {
  const [totalLojas, lojasAtivas, receitaTotal, totalAgendamentos] = await Promise.all([
    db.select({ count: count() }).from(lojas),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` }).from(pagamentos).where(eq(pagamentos.status, 'pago')),
    db.select({ count: count() }).from(agendamentos),
  ])

  const boxes         = totalLojas[0].count
  const boxesAtivos   = lojasAtivas[0].count
  const taxaAtivacao  = boxes > 0 ? Math.round((boxesAtivos / boxes) * 100) : 0
  const receita       = parseFloat(receitaTotal[0]?.total || '0')

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── HERO RACING ────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden carbon-bg"
        style={{ border: '1px solid rgba(220,0,0,0.2)' }}>
        <div className="absolute top-0 left-0 right-0 h-2 checkers-stripe opacity-50" />
        <div className="absolute top-2 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

        <div className="relative p-5 pt-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Texto */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #DC0000, #7B0000)', boxShadow: '0 0 24px rgba(220,0,0,0.4)' }}>
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[4px]" style={{ color: '#DC0000' }}>
                  TRUXZ · CHAMPIONSHIP
                </p>
                <h1 className="text-xl font-black text-white tracking-wide">Central do Campeonato</h1>
              </div>
            </div>
            <p className="text-xs text-white/30 mb-4">Visão geral de todos os circuitos</p>

            {/* Progress bar racing */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/40">Boxes ativos no campeonato</span>
                <span className="font-black" style={{ color: '#DC0000' }}>{taxaAtivacao}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${taxaAtivacao}%`, background: 'linear-gradient(90deg, #DC0000, #FF8700)' }} />
              </div>
              <p className="text-[10px] text-white/20 mt-1">{boxesAtivos} de {boxes} boxes em operação</p>
            </div>
          </div>

          {/* Gauge taxa ativação */}
          <div className="flex-shrink-0">
            <Gauge value={taxaAtivacao} max={100} size={120} unit="%" sub="ativação" color="purple" />
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Boxes no Grid',     value: boxes,                      color: '#9D4EDD', Icon: Store,    bg: 'rgba(157,78,221,0.1)',  border: 'rgba(157,78,221,0.25)' },
          { label: 'Boxes Ativos',      value: boxesAtivos,                color: '#34C759', Icon: Activity, bg: 'rgba(52,199,89,0.1)',   border: 'rgba(52,199,89,0.25)' },
          { label: 'Receita Total',     value: formatCurrency(receita),    color: '#FF8700', Icon: BarChart3, bg: 'rgba(255,135,0,0.1)',  border: 'rgba(255,135,0,0.25)' },
          { label: 'Corridas Realizadas', value: totalAgendamentos[0].count, color: '#DC0000', Icon: Flag,   bg: 'rgba(220,0,0,0.1)',    border: 'rgba(220,0,0,0.25)' },
        ].map(({ label, value, color, Icon, bg, border }) => (
          <div key={label} className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs mt-0.5 text-white/30">{label}</p>
          </div>
        ))}
      </div>

      {/* ── CONTROLE DO GRID ───────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full"
            style={{ background: 'linear-gradient(180deg, #DC0000, #FF8700)' }} />
          <h3 className="font-black text-white text-sm tracking-wide">Controle do Grid</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Gerenciar Boxes',     href: '/master/lojas',      Icon: Store,      color: '#9D4EDD' },
            { label: 'Financeiro Geral',    href: '/master/financeiro', Icon: BarChart3,  color: '#34C759' },
            { label: 'Planos & Preços',     href: '/master/planos',     Icon: TrendingUp, color: '#FF8700' },
            { label: 'Adicionar Box',       href: '/master/lojas/nova', Icon: Plus,       color: '#DC0000' },
          ].map(({ label, href, Icon, color }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-sm font-bold text-white/50">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
