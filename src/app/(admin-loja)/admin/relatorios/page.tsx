'use client'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp, Users, CalendarDays, Star } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ResumoMes {
  mes: string
  receita: number
  agendamentos: number
}

interface ServicoPopular {
  nome: string
  total: number
  receita: number
}

interface StatusDistrib {
  status: string
  total: number
}

interface DashData {
  receitaMensal: ResumoMes[]
  servicosPopulares: ServicoPopular[]
  statusDistribuicao: StatusDistrib[]
  ticketMedio: number
  totalClientes: number
  avaliacaoMedia: number
  agendamentosHoje: number
}

const CORES_STATUS: Record<string, string> = {
  concluido:    '#10b981',
  pendente:     '#f59e0b',
  cancelado:    '#ef4444',
  em_andamento: '#3b82f6',
  confirmado:   '#8b5cf6',
  no_show:      '#9ca3af',
}

const CORES_PIE = ['#ea580c','#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5']

export default function RelatoriosPage() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['relatorios'],
    queryFn: () => fetch('/api/relatorios').then(r => r.json()),
  })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Ticket Médio',
            value: formatCurrency(data.ticketMedio),
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total Clientes',
            value: data.totalClientes,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Agendamentos Hoje',
            value: data.agendamentosHoje,
            icon: CalendarDays,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            label: 'Avaliação Média',
            value: data.avaliacaoMedia > 0 ? `${data.avaliacaoMedia.toFixed(1)} ★` : '—',
            icon: Star,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="card">
              <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Receita mensal - Area Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Receita dos Últimos 6 Meses</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ea580c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontWeight: 600 }} />
              <Area
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="#ea580c"
                strokeWidth={2.5}
                fill="url(#gradReceita)"
                dot={{ fill: '#ea580c', r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Agendamentos por mês - Bar Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Agendamentos por Mês</h3>
        {data.receitaMensal.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sem dados suficientes</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip labelStyle={{ fontWeight: 600 }} />
              <Bar dataKey="agendamentos" name="Agendamentos" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Serviços mais populares */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Serviços Mais Realizados</h3>
          {data.servicosPopulares.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {data.servicosPopulares.map((s, i) => {
                const max = data.servicosPopulares[0].total
                const pct = Math.round((s.total / max) * 100)
                return (
                  <div key={s.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{s.nome}</p>
                      <span className="text-xs font-bold text-gray-600 flex-shrink-0">
                        {s.total}x · {formatCurrency(s.receita)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CORES_PIE[i % CORES_PIE.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Distribuição de status - Pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Status dos Agendamentos</h3>
          {data.statusDistribuicao.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusDistribuicao}
                  dataKey="total"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={35}
                  paddingAngle={3}
                >
                  {data.statusDistribuicao.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={CORES_STATUS[entry.status] ?? '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 11, textTransform: 'capitalize' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
