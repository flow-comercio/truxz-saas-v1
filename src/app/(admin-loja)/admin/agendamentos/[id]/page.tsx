import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos, pagamentos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { formatCurrency, formatDateTime, minutesToHours } from '@/lib/utils'
import { AgendamentoAcoes } from '@/components/admin/agendamento-acoes'
import { FotosAgendamento } from '@/components/admin/fotos-agendamento'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente:     { label: 'Pendente',     className: 'badge-warning' },
  confirmado:   { label: 'Confirmado',   className: 'badge-info' },
  em_andamento: { label: 'Em Andamento', className: 'badge-info' },
  concluido:    { label: 'Concluído',    className: 'badge-success' },
  cancelado:    { label: 'Cancelado',    className: 'badge-danger' },
  no_show:      { label: 'No-show',      className: 'badge-neutral' },
}

export default async function AgendamentoDetalhe({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const [ag] = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal,
      observacoes: agendamentos.observacoes,
      observacoesInternas: agendamentos.observacoesInternas,
      avaliacao: agendamentos.avaliacao,
      comentarioAvaliacao: agendamentos.comentarioAvaliacao,
      clienteId: agendamentos.clienteId,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      clienteEmail: usuarios.email,
      servicoNome: servicos.nome,
      servicoDuracao: servicos.duracaoMinutos,
      servicoPreco: servicos.preco,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
      veiculoCor: veiculos.cor,
      veiculoMarca: veiculos.marca,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.lojaId, lojaId)))
    .limit(1)

  if (!ag) notFound()

  // Buscar pagamento
  const [pag] = await db
    .select()
    .from(pagamentos)
    .where(eq(pagamentos.agendamentoId, ag.id))
    .limit(1)

  const status = STATUS_LABELS[ag.status ?? 'pendente']

  return (
    <div className="p-4 lg:p-6 max-w-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/agendamentos"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Agendamento</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={status.className}>{status.label}</span>
            <span className="text-xs text-gray-400">
              {ag.dataHoraInicio ? formatDateTime(ag.dataHoraInicio) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="card space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</p>
        <p className="font-bold text-gray-900">{ag.clienteNome}</p>
        <p className="text-sm text-gray-500">{ag.clienteEmail}</p>
        {ag.clienteTelefone && (
          <a
            href={`tel:${ag.clienteTelefone}`}
            className="text-sm text-orange-600 font-medium"
          >
            {ag.clienteTelefone}
          </a>
        )}
      </div>

      {/* Serviço */}
      <div className="card space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Serviço</p>
        <p className="font-bold text-gray-900">{ag.servicoNome}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{minutesToHours(ag.servicoDuracao)}</span>
          <span className="font-bold text-orange-600">{formatCurrency(parseFloat(ag.precoTotal))}</span>
        </div>
      </div>

      {/* Veículo */}
      {ag.veiculoPlaca && (
        <div className="card space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Veículo</p>
          <p className="font-bold text-gray-900">{ag.veiculoPlaca}</p>
          <p className="text-sm text-gray-500">
            {[ag.veiculoMarca, ag.veiculoModelo, ag.veiculoCor].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Observações */}
      {ag.observacoes && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Obs. do Cliente</p>
          <p className="text-sm text-gray-700">{ag.observacoes}</p>
        </div>
      )}

      {/* Observações internas */}
      {ag.observacoesInternas && (
        <div className="card bg-amber-50 border-amber-100">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Obs. Internas</p>
          <p className="text-sm text-amber-800">{ag.observacoesInternas}</p>
        </div>
      )}

      {/* Avaliação */}
      {ag.avaliacao && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avaliação</p>
          <p className="text-amber-500 text-xl">
            {'★'.repeat(ag.avaliacao)}{'☆'.repeat(5 - ag.avaliacao)}
          </p>
          {ag.comentarioAvaliacao && (
            <p className="text-sm text-gray-600 mt-1">{ag.comentarioAvaliacao}</p>
          )}
        </div>
      )}

      {/* Pagamento */}
      {pag && (
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pagamento</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{pag.metodo ?? 'Pix'}</span>
            <span className={`${pag.status === 'pago' ? 'badge-success' : 'badge-warning'}`}>
              {pag.status}
            </span>
          </div>
          <p className="font-bold text-gray-900">{formatCurrency(parseFloat(pag.valor))}</p>
        </div>
      )}

      {/* Fotos antes/depois */}
      <FotosAgendamento
        agendamentoId={ag.id}
        fotoAntes={(ag as any).fotoAntes ?? []}
        fotoDepois={(ag as any).fotoDepois ?? []}
        editavel={['em_andamento', 'concluido'].includes(ag.status ?? '')}
      />

      {/* Ações (client component) */}
      <AgendamentoAcoes
        id={ag.id}
        statusAtual={ag.status ?? 'pendente'}
      />
    </div>
  )
}
