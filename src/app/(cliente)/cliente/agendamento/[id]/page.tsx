import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, veiculos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, Calendar, Car } from 'lucide-react'
import { formatCurrency, formatDateTime, minutesToHours } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral'; emoji: string }> = {
  pendente:     { label: 'Aguardando confirmação', variant: 'amber',   emoji: '⏳' },
  confirmado:   { label: 'Confirmado',             variant: 'purple',  emoji: '✅' },
  em_andamento: { label: 'Em andamento',           variant: 'purple',  emoji: '🔧' },
  concluido:    { label: 'Concluído',              variant: 'green',   emoji: '🎉' },
  cancelado:    { label: 'Cancelado',              variant: 'red',     emoji: '❌' },
  no_show:      { label: 'Não compareceu',         variant: 'neutral', emoji: '🚫' },
}

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.35), transparent)' }

export default async function ClienteAgendamentoDetalhe({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId = session!.user.lojaId!

  const [ag] = await db
    .select({
      id: agendamentos.id, status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio, dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal, observacoes: agendamentos.observacoes,
      avaliacao: agendamentos.avaliacao, comentarioAvaliacao: agendamentos.comentarioAvaliacao,
      servicoNome: servicos.nome, servicoDescricao: servicos.descricao,
      servicoDuracao: servicos.duracaoMinutos,
      veiculoPlaca: veiculos.placa, veiculoModelo: veiculos.modelo, veiculoCor: veiculos.cor,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.clienteId, clienteId), eq(agendamentos.lojaId, lojaId)))
    .limit(1)

  if (!ag) notFound()

  const cfg = STATUS_CONFIG[ag.status ?? 'pendente']

  const statusBg: Record<string, string> = {
    concluido: 'rgba(52,211,153,0.1)', cancelado: 'rgba(248,113,113,0.1)',
    em_andamento: 'rgba(157,78,221,0.1)', default: 'rgba(251,191,36,0.1)',
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0B1E', fontFamily: 'Nunito, sans-serif' }}>
      <div className="px-4 py-4 sticky top-0 z-10 flex items-center gap-3"
        style={{ background: 'rgba(13,11,30,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <Link href="/cliente" className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(157,78,221,0.15)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#A0A0B8' }} />
        </Link>
        <h1 className="font-black text-white">Detalhes do Agendamento</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Banner */}
        <div className="rounded-2xl p-5 text-center"
          style={{ background: statusBg[ag.status ?? 'default'] ?? statusBg.default, border: '1px solid rgba(157,78,221,0.15)' }}>
          <p className="text-4xl mb-2">{cfg.emoji}</p>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>

        {/* Serviço */}
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Serviço</p>
          <p className="font-black text-white text-lg">{ag.servicoNome}</p>
          {ag.servicoDescricao && <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>{ag.servicoDescricao}</p>}
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(157,78,221,0.1)' }}>
            <div className="flex items-center gap-1 text-sm" style={{ color: '#A0A0B8' }}>
              <Clock className="w-4 h-4" />{minutesToHours(ag.servicoDuracao)}
            </div>
            <span className="font-black text-lg" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(ag.precoTotal))}</span>
          </div>
        </div>

        {/* Data e hora */}
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Data e Horário</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <p className="text-sm font-bold text-white">{ag.dataHoraInicio ? formatDateTime(ag.dataHoraInicio) : '--'}</p>
          </div>
          {ag.dataHoraFim && (
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" style={{ color: '#55556A' }} />
              <p className="text-sm" style={{ color: '#A0A0B8' }}>
                Previsão de término: {new Date(ag.dataHoraFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* Veículo */}
        {ag.veiculoPlaca && (
          <div style={card}>
            <div style={shimmer} />
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Veículo</p>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" style={{ color: '#9D4EDD' }} />
              <div>
                <p className="font-black text-white">{ag.veiculoPlaca}</p>
                {(ag.veiculoModelo || ag.veiculoCor) && (
                  <p className="text-xs" style={{ color: '#A0A0B8' }}>{[ag.veiculoModelo, ag.veiculoCor].filter(Boolean).join(' · ')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {ag.observacoes && (
          <div style={card}>
            <div style={shimmer} />
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Suas observações</p>
            <p className="text-sm" style={{ color: '#A0A0B8' }}>{ag.observacoes}</p>
          </div>
        )}

        {/* Avaliação */}
        {ag.status === 'concluido' && (
          <div style={card}>
            <div style={shimmer} />
            {ag.avaliacao ? (
              <>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Sua Avaliação</p>
                <p className="text-xl" style={{ color: '#FBBF24' }}>{'★'.repeat(ag.avaliacao)}{'☆'.repeat(5 - ag.avaliacao)}</p>
                {ag.comentarioAvaliacao && <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>{ag.comentarioAvaliacao}</p>}
              </>
            ) : (
              <>
                <p className="font-black text-white mb-3">Como foi o serviço?</p>
                <Link href={`/cliente/agendamento/${ag.id}/avaliar`} className="btn-primary text-sm">Deixar avaliação</Link>
              </>
            )}
          </div>
        )}

        <Link href="/cliente/agendar" className="btn-primary w-full">+ Novo Agendamento</Link>
      </div>
    </div>
  )
}
