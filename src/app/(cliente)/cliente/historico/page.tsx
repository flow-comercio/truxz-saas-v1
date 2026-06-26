import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { Clock, Star, CheckCircle, XCircle, AlertCircle, Timer, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STATUS_CFG: Record<string, {
  label: string
  variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral'
  Icon: any
  color: string
}> = {
  pendente:     { label: 'Pendente',     variant: 'amber',   Icon: Clock,         color: '#FF9F0A' },
  confirmado:   { label: 'Confirmado',   variant: 'purple',  Icon: Timer,         color: '#9D4EDD' },
  em_andamento: { label: 'Em Andamento', variant: 'purple',  Icon: Timer,         color: '#3F8EFF' },
  concluido:    { label: 'Concluído',    variant: 'green',   Icon: CheckCircle,   color: '#34C759' },
  cancelado:    { label: 'Cancelado',    variant: 'red',     Icon: XCircle,       color: '#FF375F' },
  no_show:      { label: 'No-show',      variant: 'neutral', Icon: AlertCircle,   color: '#55556A' },
}

function formatMes(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function formatDia(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatHora(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default async function HistoricoPage() {
  const session  = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId   = session!.user.lojaId!

  const historico = await db
    .select({
      id:             agendamentos.id,
      status:         agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      precoTotal:     agendamentos.precoTotal,
      avaliacao:      agendamentos.avaliacao,
      servicoNome:    servicos.nome,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(eq(agendamentos.clienteId, clienteId), eq(agendamentos.lojaId, lojaId)))
    .orderBy(desc(agendamentos.dataHoraInicio))
    .limit(50)

  // Agrupar por mês
  const porMes = historico.reduce<Record<string, typeof historico>>((acc, ag) => {
    const mes = ag.dataHoraInicio
      ? formatMes(new Date(ag.dataHoraInicio))
      : 'Sem data'
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(ag)
    return acc
  }, {})

  const concluidos = historico.filter(a => a.status === 'concluido').length
  const totalGasto  = historico
    .filter(a => a.status === 'concluido')
    .reduce((s, a) => s + parseFloat(a.precoTotal), 0)

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER ─────────────────────────────── */}
      <div className="sticky top-0 z-20 safe-top glass-strong"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <div className="px-4 py-4">
          <h1 className="font-black text-white">Histórico</h1>
          <p className="text-xs text-white/35 mt-0.5">{historico.length} agendamento(s)</p>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────── */}
      {historico.length > 0 && (
        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          <div className="card p-3 flex flex-col gap-1">
            <CheckCircle className="w-4 h-4 text-[#34C759]" />
            <p className="text-2xl font-black text-white">{concluidos}</p>
            <p className="text-xs text-white/30">concluídos</p>
          </div>
          <div className="card p-3 flex flex-col gap-1">
            <Star className="w-4 h-4 text-[#C77DFF]" />
            <p className="text-2xl font-black text-white">{formatCurrency(totalGasto)}</p>
            <p className="text-xs text-white/30">investido</p>
          </div>
        </div>
      )}

      {/* ── TIMELINE ───────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        {historico.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)' }}>
              <Calendar className="w-7 h-7 text-white/20" />
            </div>
            <p className="font-bold text-white/40">Nenhum agendamento ainda</p>
            <p className="text-xs text-white/20 mt-1">Seus serviços aparecerão aqui</p>
            <Link href="/cliente/agendar" className="btn-primary mt-4 mx-auto px-5 text-sm" style={{ height: 40 }}>
              Agendar agora
            </Link>
          </div>
        ) : Object.entries(porMes).map(([mes, ags]) => (
          <div key={mes} className="mb-6">
            {/* Cabeçalho do mês */}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-black uppercase tracking-widest"
                style={{ color: '#9D4EDD' }}>{mes}</p>
              <div className="flex-1 h-px" style={{ background: 'rgba(157,78,221,0.15)' }} />
              <span className="text-[10px] font-bold text-white/20">{ags.length}</span>
            </div>

            {/* Itens da timeline */}
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px"
                style={{ background: 'rgba(157,78,221,0.15)' }} />

              <div className="space-y-3">
                {ags.map(ag => {
                  const cfg  = STATUS_CFG[ag.status ?? 'pendente'] ?? STATUS_CFG.pendente
                  const Icon = cfg.Icon
                  const dt   = ag.dataHoraInicio ? new Date(ag.dataHoraInicio) : null

                  return (
                    <Link key={ag.id} href={`/cliente/agendamento/${ag.id}`}>
                      <div className="flex gap-3 group">
                        {/* Dot */}
                        <div className="relative flex-shrink-0 mt-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 relative"
                            style={{ background: `${cfg.color}15`, border: `1.5px solid ${cfg.color}40` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                        </div>

                        {/* Card */}
                        <div className="flex-1 card p-3 active:scale-[0.99]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-white text-sm truncate">{ag.servicoNome}</p>
                              {dt && (
                                <p className="text-xs text-white/35 mt-0.5">
                                  {formatDia(dt)} · {formatHora(dt)}
                                </p>
                              )}
                              {ag.avaliacao && (
                                <div className="flex items-center gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3"
                                      style={{ color: i < ag.avaliacao! ? '#FF9F0A' : '#55556A', fill: i < ag.avaliacao! ? '#FF9F0A' : 'none' }} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              <p className="text-sm font-black text-[#C77DFF]">
                                {formatCurrency(parseFloat(ag.precoTotal))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
