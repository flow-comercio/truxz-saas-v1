import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, pagamentos, usuarios, servicos } from '@/db/schema'
import { eq, and, gte, count, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { CalendarDays, Users, TrendingUp, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Gauge } from '@/components/ui/gauge'

const STATUS_MAP: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' }> = {
  pendente:     { label: 'Na Fila',    variant: 'amber' },
  confirmado:   { label: 'Confirmado', variant: 'purple' },
  em_andamento: { label: 'Em Serviço', variant: 'purple' },
  concluido:    { label: 'Concluído',  variant: 'green' },
  cancelado:    { label: 'Cancelado',  variant: 'red' },
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const lojaId  = session!.user.lojaId!

  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [agHojeRes, receitaMesRes, clientesRes, statusRes, proximosRes] = await Promise.all([
    db.select({ total: count() }).from(agendamentos)
      .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, hoje))),

    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` }).from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMes))),

    db.select({ total: count() }).from(usuarios)
      .where(and(eq(usuarios.lojaId, lojaId), eq(usuarios.role, 'cliente'))),

    db.select({ status: agendamentos.status, total: count() }).from(agendamentos)
      .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, hoje)))
      .groupBy(agendamentos.status),

    db.select({
      id:             agendamentos.id,
      dataHoraInicio: agendamentos.dataHoraInicio,
      status:         agendamentos.status,
      clienteNome:    usuarios.nome,
      servicoNome:    servicos.nome,
    })
      .from(agendamentos)
      .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
      .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
      .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, hoje)))
      .orderBy(agendamentos.dataHoraInicio)
      .limit(5),
  ])

  const agHoje   = agHojeRes[0].total
  const receita  = parseFloat(receitaMesRes[0]?.total || '0')
  const clientes = clientesRes[0].total
  const statusMap   = Object.fromEntries(statusRes.map(s => [s.status, s.total]))
  const pendentes   = statusMap['pendente']     || 0
  const emAndamento = statusMap['em_andamento'] || 0
  const concluidos  = statusMap['concluido']    || 0

  // Gauge: receita mensal com meta de R$5k
  const metaReceita   = 5000
  const receitaGauge  = Math.min(Math.round(receita), metaReceita)

  // Stat cards progresso (max razoável por dia = 20 agendamentos)
  const maxHoje = 20

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-5">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div>
        <p className="section-tag mb-2">Pit Lane Control</p>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-white/35 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── GAUGE RECEITA + STATS ───────────────────────────────── */}
      <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge grande de receita */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Gauge
            value={receitaGauge}
            max={metaReceita}
            size={160}
            unit="R$"
            sub="faturamento"
            color="purple"
          />
          <p className="text-xs font-black text-white/25 uppercase tracking-widest">este mês</p>
        </div>

        {/* Grid 2×2 de stats */}
        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          {/* Agendamentos hoje */}
          <div className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CalendarDays className="w-4 h-4 text-[#3F8EFF]" />
              <span className="text-2xl font-black text-white">{agHoje}</span>
            </div>
            <p className="label" style={{ marginBottom: 4 }}>Hoje</p>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${Math.min(100, (agHoje / maxHoje) * 100)}%`, background: 'linear-gradient(90deg, #3F8EFF, #C77DFF)' }} />
            </div>
            <p className="text-[10px] text-white/25">{agHoje} de {maxHoje} meta</p>
          </div>

          {/* Clientes */}
          <div className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-[#34C759]" />
              <span className="text-2xl font-black text-white">{clientes}</span>
            </div>
            <p className="label" style={{ marginBottom: 4 }}>Clientes</p>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${Math.min(100, (clientes / 100) * 100)}%`, background: 'linear-gradient(90deg, #34C759, #00D4FF)' }} />
            </div>
            <p className="text-[10px] text-white/25">{clientes} cadastrados</p>
          </div>

          {/* Em serviço */}
          <div className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-4 h-4 text-[#FF9F0A]" />
              <span className="text-2xl font-black text-white">{emAndamento}</span>
            </div>
            <p className="label" style={{ marginBottom: 4 }}>Em Serviço</p>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${Math.min(100, (emAndamento / Math.max(agHoje, 1)) * 100)}%`, background: 'linear-gradient(90deg, #FF9F0A, #FF375F)' }} />
            </div>
            <p className="text-[10px] text-white/25">{pendentes} aguardando</p>
          </div>

          {/* Concluídos */}
          <div className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-4 h-4 text-[#9D4EDD]" />
              <span className="text-2xl font-black text-white">{concluidos}</span>
            </div>
            <p className="label" style={{ marginBottom: 4 }}>Concluídos</p>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${Math.min(100, (concluidos / Math.max(agHoje, 1)) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-white/25">{agHoje > 0 ? Math.round((concluidos / agHoje) * 100) : 0}% do dia</p>
          </div>
        </div>
      </div>

      {/* ── AÇÕES RÁPIDAS ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/admin/agendamentos/novo">
          <div className="btn-primary w-full justify-center" style={{ height: 48 }}>
            + Novo Agendamento
          </div>
        </Link>
        <Link href="/admin/os">
          <div className="btn-secondary w-full justify-center" style={{ height: 48 }}>
            Ordens de Serviço
          </div>
        </Link>
      </div>

      {/* ── PRÓXIMOS AGENDAMENTOS ──────────────────────────────── */}
      {proximosRes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-white text-sm">Próximos hoje</h2>
            <Link href="/admin/agendamentos" className="text-xs font-bold text-[#9D4EDD]">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {proximosRes.map(ag => {
              const s    = STATUS_MAP[ag.status ?? 'pendente']
              const hora = new Date(ag.dataHoraInicio)
                .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              return (
                <Link key={ag.id} href={`/admin/agendamentos/${ag.id}`}>
                  <div className="card p-4 flex items-center gap-3 active:scale-[0.99]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(157,78,221,0.1)' }}>
                      <Clock className="w-4 h-4 text-[#9D4EDD]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{ag.clienteNome}</p>
                      <p className="text-xs text-white/35 mt-0.5 truncate">{ag.servicoNome}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="font-black text-white/70 text-sm tabular-nums">{hora}</span>
                      <Badge variant={s?.variant ?? 'neutral'}>{s?.label}</Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
