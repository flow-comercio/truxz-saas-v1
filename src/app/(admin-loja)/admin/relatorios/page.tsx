'use client'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp, Users, CalendarDays, Star } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ResumoMes       { mes: string; receita: number; agendamentos: number }
interface ServicoPopular  { nome: string; total: number; receita: number }
interface StatusDistrib   { status: string; total: number }
interface DashData {
  receitaMensal: ResumoMes[]; servicosPopulares: ServicoPopular[]
  statusDistribuicao: StatusDistrib[]; ticketMedio: number
  totalClientes: number; avaliacaoMedia: number; agendamentosHoje: number
}

const CORES_STATUS: Record<string, string> = {
  concluido: '#34C759', pendente: '#FF9F0A', cancelado: '#FF375F',
  em_andamento: '#3F8EFF', confirmado: '#9D4EDD', no_show: '#55556A',
}
const CORES_PIE   = ['#9D4EDD', '#7B2FBE', '#C77DFF', '#5A189A', '#E040FB', '#AB47BC']
const TOOLTIP_STYLE = { background: '#12101E', border: '1px solid rgba(157,78,221,0.3)', borderRadius: 8, color: '#fff', fontSize: 12 }

export default function RelatoriosPage() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['relatorios'],
    queryFn:  () => fetch('/api/relatorios').then(r => r.json()),
  })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
      </div>
    )
  }

  const kpis = [
    { label: 'Ticket Médio',       value: formatCurrency(data.ticketMedio),    icon: TrendingUp,   color: '#34C759', bg: 'rgba(52,199,89,0.1)',    border: 'rgba(52,199,89,0.25)' },
    { label: 'Total Clientes',     value: data.totalClientes,                  icon: Users,        color: '#9D4EDD', bg: 'rgba(157,78,221,0.1)',   border: 'rgba(157,78,221,0.25)' },
    { label: 'Agendamentos Hoje',  value: data.agendamentosHoje,               icon: CalendarDays, color: '#C77DFF', bg: 'rgba(199,125,255,0.1)',  border: 'rgba(199,125,255,0.25)' },
    { label: 'Avaliação Média',    value: data.avaliacaoMedia > 0 ? `${data.avaliacaoMedia.toFixed(1)} ★` : '—', icon: Star, color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)', border: 'rgba(255,159,10,0.25)' },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div>
        <p className="section-tag mb-1">Análises</p>
        <h1 className="text-xl font-black text-white">Relatórios</h1>
      </div>

      {/* ── KPIs ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="card p-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-xl font-black text-white">{kpi.value}</p>
              <p className="text-xs mt-0.5 text-white/30">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* ── RECEITA MENSAL ─────────────────────────── */}
      <div className="card p-5">
        <h3 className="font-black text-white mb-5 text-sm">Receita dos Últimos 6 Meses</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-center py-8 text-white/20">Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9D4EDD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9D4EDD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,78,221,0.06)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="#9D4EDD" strokeWidth={2.5} fill="url(#gradReceita)" dot={{ fill: '#9D4EDD', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── AGENDAMENTOS POR MÊS ───────────────────── */}
      <div className="card p-5">
        <h3 className="font-black text-white mb-5 text-sm">Agendamentos por Mês</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-center py-8 text-white/20">Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,78,221,0.06)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="agendamentos" name="Agendamentos" fill="#9D4EDD" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── GRID: SERVIÇOS + STATUS ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Serviços mais realizados */}
        <div className="card p-5">
          <h3 className="font-black text-white mb-5 text-sm">Serviços Mais Realizados</h3>
          {data.servicosPopulares.length === 0 ? (
            <p className="text-sm text-center py-8 text-white/20">Sem dados</p>
          ) : (
            <div className="space-y-4">
              {data.servicosPopulares.map((s, i) => {
                const max = data.servicosPopulares[0].total
                const pct = Math.round((s.total / max) * 100)
                const cor = CORES_PIE[i % CORES_PIE.length]
                return (
                  <div key={s.nome}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-white truncate flex-1 mr-2">{s.nome}</p>
                      <span className="text-xs font-black flex-shrink-0 text-white/30">
                        {s.total}× · {formatCurrency(s.receita)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: cor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Distribuição de status */}
        <div className="card p-5">
          <h3 className="font-black text-white mb-5 text-sm">Status dos Agendamentos</h3>
          {data.statusDistribuicao.length === 0 ? (
            <p className="text-sm text-center py-8 text-white/20">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusDistribuicao}
                  dataKey="total"
                  nameKey="status"
                  cx="50%" cy="50%"
                  outerRadius={72} innerRadius={36}
                  paddingAngle={3}>
                  {data.statusDistribuicao.map(entry => (
                    <Cell key={entry.status} fill={CORES_STATUS[entry.status] ?? '#55556A'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend formatter={v => (
                  <span style={{ fontSize: 11, color: '#A0A0B8', textTransform: 'capitalize' }}>{v}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
