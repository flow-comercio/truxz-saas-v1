'use client'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp, Users, CalendarDays, Star } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ResumoMes { mes: string; receita: number; agendamentos: number }
interface ServicoPopular { nome: string; total: number; receita: number }
interface StatusDistrib { status: string; total: number }
interface DashData {
  receitaMensal: ResumoMes[]; servicosPopulares: ServicoPopular[]
  statusDistribuicao: StatusDistrib[]; ticketMedio: number
  totalClientes: number; avaliacaoMedia: number; agendamentosHoje: number
}

const CORES_STATUS: Record<string, string> = {
  concluido: '#34D399', pendente: '#FBBF24', cancelado: '#F87171',
  em_andamento: '#818CF8', confirmado: '#9D4EDD', no_show: '#55556A',
}
const CORES_PIE = ['#9D4EDD','#7B2FBE','#C77DFF','#5A189A','#E040FB','#AB47BC']
const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1.25rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.4), transparent)' }

const tooltipStyle = { background: '#12101E', border: '1px solid rgba(157,78,221,0.3)', borderRadius: 8, color: '#fff', fontSize: 12 }

export default function RelatoriosPage() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['relatorios'],
    queryFn: () => fetch('/api/relatorios').then(r => r.json()),
  })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
      </div>
    )
  }

  const kpis = [
    { label: 'Ticket Médio', value: formatCurrency(data.ticketMedio), icon: TrendingUp, color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
    { label: 'Total Clientes', value: data.totalClientes, icon: Users, color: '#9D4EDD', bg: 'rgba(157,78,221,0.1)', border: 'rgba(157,78,221,0.25)' },
    { label: 'Agendamentos Hoje', value: data.agendamentosHoje, icon: CalendarDays, color: '#C77DFF', bg: 'rgba(199,125,255,0.1)', border: 'rgba(199,125,255,0.25)' },
    { label: 'Avaliação Média', value: data.avaliacaoMedia > 0 ? `${data.avaliacaoMedia.toFixed(1)} ★` : '—', icon: Star, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <h1 className="text-xl font-black text-white">Relatórios</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} style={card}>
              <div style={shimmer} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-xl font-black text-white">{kpi.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Receita mensal */}
      <div style={card}>
        <div style={shimmer} />
        <h3 className="font-black text-white mb-4">Receita dos Últimos 6 Meses</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#55556A' }}>Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9D4EDD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9D4EDD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,78,221,0.08)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="#9D4EDD" strokeWidth={2.5} fill="url(#gradReceita)" dot={{ fill: '#9D4EDD', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Agendamentos por mês */}
      <div style={card}>
        <div style={shimmer} />
        <h3 className="font-black text-white mb-4">Agendamentos por Mês</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#55556A' }}>Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,78,221,0.08)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#55556A' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="agendamentos" name="Agendamentos" fill="#9D4EDD" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Serviços populares */}
        <div style={card}>
          <div style={shimmer} />
          <h3 className="font-black text-white mb-4">Serviços Mais Realizados</h3>
          {data.servicosPopulares.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#55556A' }}>Sem dados</p>
          ) : (
            <div className="space-y-3">
              {data.servicosPopulares.map((s, i) => {
                const max = data.servicosPopulares[0].total
                const pct = Math.round((s.total / max) * 100)
                return (
                  <div key={s.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-white truncate flex-1 mr-2">{s.nome}</p>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: '#55556A' }}>
                        {s.total}x · {formatCurrency(s.receita)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CORES_PIE[i % CORES_PIE.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Distribuição de status */}
        <div style={card}>
          <div style={shimmer} />
          <h3 className="font-black text-white mb-4">Status dos Agendamentos</h3>
          {data.statusDistribuicao.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#55556A' }}>Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.statusDistribuicao} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {data.statusDistribuicao.map(entry => (
                    <Cell key={entry.status} fill={CORES_STATUS[entry.status] ?? '#55556A'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={v => <span style={{ fontSize: 11, color: '#A0A0B8', textTransform: 'capitalize' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
