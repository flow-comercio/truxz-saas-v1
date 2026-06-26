import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos } from '@/db/schema'
import { eq, and, gte, lte, count } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus, CalendarDays, ChevronRight } from 'lucide-react'
import { FiltroData } from '@/components/admin/filtro-data'
import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, {
  label: string
  variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral'
  barColor: string
}> = {
  pendente:     { label: 'Pendente',     variant: 'amber',   barColor: '#FF9F0A' },
  confirmado:   { label: 'Confirmado',   variant: 'purple',  barColor: '#9D4EDD' },
  em_andamento: { label: 'Em Andamento', variant: 'purple',  barColor: '#3F8EFF' },
  concluido:    { label: 'Concluído',    variant: 'green',   barColor: '#34C759' },
  cancelado:    { label: 'Cancelado',    variant: 'red',     barColor: '#FF375F' },
  no_show:      { label: 'No-show',      variant: 'neutral', barColor: '#55556A' },
}

export default async function AgendamentosPage({ searchParams }: { searchParams: { data?: string } }) {
  const session = await getServerSession(authOptions)
  const lojaId  = session!.user.lojaId!

  const dataFiltro = searchParams.data ? new Date(searchParams.data + 'T12:00:00') : new Date()
  const inicio = new Date(dataFiltro); inicio.setHours(0, 0, 0, 0)
  const fim    = new Date(dataFiltro); fim.setHours(23, 59, 59, 999)

  const lista = await db
    .select({
      id:              agendamentos.id,
      dataHoraInicio:  agendamentos.dataHoraInicio,
      status:          agendamentos.status,
      precoTotal:      agendamentos.precoTotal,
      clienteNome:     usuarios.nome,
      clienteTelefone: usuarios.telefone,
      servicoNome:     servicos.nome,
      veiculoPlaca:    veiculos.placa,
      veiculoModelo:   veiculos.modelo,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(
      eq(agendamentos.lojaId, lojaId),
      gte(agendamentos.dataHoraInicio, inicio),
      lte(agendamentos.dataHoraInicio, fim),
    ))
    .orderBy(agendamentos.dataHoraInicio)

  const dataStr = dataFiltro.toISOString().split('T')[0]

  // Contadores por status
  const porStatus = lista.reduce<Record<string, number>>((acc, a) => {
    const s = a.status ?? 'pendente'; acc[s] = (acc[s] || 0) + 1; return acc
  }, {})
  const receitaDia = lista
    .filter(a => a.status === 'concluido')
    .reduce((s, a) => s + parseFloat(a.precoTotal), 0)

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-4">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Gestão</p>
          <h1 className="text-xl font-black text-white">Agendamentos</h1>
        </div>
        <Link href="/admin/agendamentos/novo" className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Novo
        </Link>
      </div>

      {/* ── FILTRO DATA ──────────────────────────── */}
      <FiltroData dataAtual={dataStr} total={lista.length} />

      {/* ── MINI STATS DO DIA ────────────────────── */}
      {lista.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Total',    value: lista.length,             color: '#9D4EDD' },
            { label: 'Pendentes', value: porStatus['pendente'] || 0, color: '#FF9F0A' },
            { label: 'Em serviço', value: porStatus['em_andamento'] || 0, color: '#3F8EFF' },
            { label: 'Concluídos', value: porStatus['concluido'] || 0, color: '#34C759' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-shrink-0 card px-4 py-2.5 flex items-center gap-2">
              <span className="text-lg font-black text-white">{value}</span>
              <span className="text-xs text-white/35">{label}</span>
            </div>
          ))}
          {receitaDia > 0 && (
            <div className="flex-shrink-0 card px-4 py-2.5 flex items-center gap-2">
              <span className="text-sm font-black text-[#C77DFF]">{formatCurrency(receitaDia)}</span>
              <span className="text-xs text-white/35">receita</span>
            </div>
          )}
        </div>
      )}

      {/* ── LISTA ────────────────────────────────── */}
      {lista.length === 0 ? (
        <div className="text-center py-16 card">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="font-bold text-white/35 mb-4">Nenhum agendamento nesta data</p>
          <Link href="/admin/agendamentos/novo"
            className="btn-primary mx-auto text-xs px-5" style={{ height: 38 }}>
            + Criar agendamento
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(ag => {
            const s    = STATUS_MAP[ag.status ?? 'pendente'] ?? STATUS_MAP.pendente
            const hora = ag.dataHoraInicio
              ? new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--'

            return (
              <Link key={ag.id} href={`/admin/agendamentos/${ag.id}`}>
                <div className="card p-0 overflow-hidden flex active:scale-[0.99] transition-all">
                  {/* Barra lateral colorida */}
                  <div className="w-1 flex-shrink-0" style={{ background: s.barColor }} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      {/* Hora */}
                      <div className="flex-shrink-0 text-center w-12">
                        <p className="font-black text-white tabular-nums text-sm leading-none">{hora}</p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm">{ag.clienteNome}</p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{ag.servicoNome}</p>
                        {ag.veiculoPlaca && (
                          <p className="text-xs text-white/25 mt-0.5">
                            🚗 {ag.veiculoPlaca}{ag.veiculoModelo ? ` · ${ag.veiculoModelo}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Status + valor */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge variant={s.variant} dot>{s.label}</Badge>
                        <p className="font-black text-sm text-[#C77DFF]">
                          {formatCurrency(parseFloat(ag.precoTotal))}
                        </p>
                        {ag.clienteTelefone && (
                          <p className="text-[10px] text-white/20">{ag.clienteTelefone}</p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
