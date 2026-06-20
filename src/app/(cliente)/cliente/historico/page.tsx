import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, lojas } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Clock } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente:     { label: 'Pendente',     className: 'badge-warning' },
  confirmado:   { label: 'Confirmado',   className: 'badge-info' },
  em_andamento: { label: 'Em Andamento', className: 'badge-info' },
  concluido:    { label: 'Concluído',    className: 'badge-success' },
  cancelado:    { label: 'Cancelado',    className: 'badge-danger' },
  no_show:      { label: 'No-show',      className: 'badge-neutral' },
}

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId    = session!.user.lojaId!

  const historico = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      precoTotal: agendamentos.precoTotal,
      avaliacao: agendamentos.avaliacao,
      servicoNome: servicos.nome,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(eq(agendamentos.clienteId, clienteId), eq(agendamentos.lojaId, lojaId)))
    .orderBy(desc(agendamentos.dataHoraInicio))
    .limit(50)

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-bold text-gray-900">Histórico</h1>
        <p className="text-xs text-gray-500 mt-0.5">{historico.length} agendamento(s)</p>
      </div>

      <div className="p-4 space-y-2">
        {historico.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum agendamento ainda</p>
          </div>
        ) : historico.map(ag => {
          const status = STATUS_LABELS[ag.status ?? 'pendente']
          return (
            <div key={ag.id} className="card !p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{ag.servicoNome}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ag.dataHoraInicio ? formatDateTime(ag.dataHoraInicio) : '--'}
                  </p>
                  {ag.avaliacao && (
                    <p className="text-xs text-amber-500 mt-1">
                      {'★'.repeat(ag.avaliacao)}{'☆'.repeat(5 - ag.avaliacao)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={status.className}>{status.label}</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatCurrency(parseFloat(ag.precoTotal))}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
