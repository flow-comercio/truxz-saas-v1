import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, veiculos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Clock, Calendar, Car } from 'lucide-react'
import { formatCurrency, formatDateTime, minutesToHours } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; className: string; emoji: string }> = {
  pendente:     { label: 'Aguardando confirmação', className: 'badge-warning', emoji: '⏳' },
  confirmado:   { label: 'Confirmado',             className: 'badge-info',    emoji: '✅' },
  em_andamento: { label: 'Em andamento',           className: 'badge-info',    emoji: '🔧' },
  concluido:    { label: 'Concluído',              className: 'badge-success', emoji: '🎉' },
  cancelado:    { label: 'Cancelado',              className: 'badge-danger',  emoji: '❌' },
  no_show:      { label: 'Não compareceu',         className: 'badge-neutral', emoji: '🚫' },
}

export default async function ClienteAgendamentoDetalhe({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId    = session!.user.lojaId!

  const [ag] = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal,
      observacoes: agendamentos.observacoes,
      avaliacao: agendamentos.avaliacao,
      comentarioAvaliacao: agendamentos.comentarioAvaliacao,
      servicoNome: servicos.nome,
      servicoDescricao: servicos.descricao,
      servicoDuracao: servicos.duracaoMinutos,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
      veiculoCor: veiculos.cor,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(
      eq(agendamentos.id, params.id),
      eq(agendamentos.clienteId, clienteId),
      eq(agendamentos.lojaId, lojaId),
    ))
    .limit(1)

  if (!ag) notFound()

  const cfg = STATUS_CONFIG[ag.status ?? 'pendente']

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/cliente" className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="font-bold text-gray-900">Detalhes do Agendamento</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 text-center ${
          ag.status === 'concluido'    ? 'bg-emerald-50' :
          ag.status === 'cancelado'    ? 'bg-red-50' :
          ag.status === 'em_andamento' ? 'bg-blue-50' :
          'bg-orange-50'
        }`}>
          <p className="text-4xl mb-2">{cfg.emoji}</p>
          <span className={cfg.className}>{cfg.label}</span>
        </div>

        {/* Serviço */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Serviço</p>
          <p className="font-bold text-gray-900 text-lg">{ag.servicoNome}</p>
          {ag.servicoDescricao && (
            <p className="text-sm text-gray-500">{ag.servicoDescricao}</p>
          )}
          <div className="flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {minutesToHours(ag.servicoDuracao)}
            </div>
            <span className="font-bold text-orange-600 text-lg">
              {formatCurrency(parseFloat(ag.precoTotal))}
            </span>
          </div>
        </div>

        {/* Data e hora */}
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data e Horário</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              {ag.dataHoraInicio
                ? formatDateTime(ag.dataHoraInicio)
                : '--'}
            </p>
          </div>
          {ag.dataHoraFim && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">
                Previsão de término: {new Date(ag.dataHoraFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* Veículo */}
        {ag.veiculoPlaca && (
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Veículo</p>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900">{ag.veiculoPlaca}</p>
                {(ag.veiculoModelo || ag.veiculoCor) && (
                  <p className="text-xs text-gray-500">
                    {[ag.veiculoModelo, ag.veiculoCor].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {ag.observacoes && (
          <div className="card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suas observações</p>
            <p className="text-sm text-gray-700">{ag.observacoes}</p>
          </div>
        )}

        {/* Avaliação */}
        {ag.status === 'concluido' && (
          <div className="card">
            {ag.avaliacao ? (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sua Avaliação</p>
                <p className="text-amber-400 text-xl">
                  {'★'.repeat(ag.avaliacao)}{'☆'.repeat(5 - ag.avaliacao)}
                </p>
                {ag.comentarioAvaliacao && (
                  <p className="text-sm text-gray-600 mt-1">{ag.comentarioAvaliacao}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-2">Como foi o serviço?</p>
                <Link
                  href={`/cliente/agendamento/${ag.id}/avaliar`}
                  className="btn-primary text-sm"
                >
                  Deixar avaliação
                </Link>
              </>
            )}
          </div>
        )}

        {/* Novo agendamento CTA */}
        <Link href="/cliente/agendar" className="btn-primary w-full">
          + Novo Agendamento
        </Link>
      </div>
    </div>
  )
}
