import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { FiltroData } from '@/components/admin/filtro-data'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente:     { label: 'Pendente',     className: 'badge-warning' },
  confirmado:   { label: 'Confirmado',   className: 'badge-info' },
  em_andamento: { label: 'Em Andamento', className: 'badge-info' },
  concluido:    { label: 'Concluído',    className: 'badge-success' },
  cancelado:    { label: 'Cancelado',    className: 'badge-danger' },
  no_show:      { label: 'No-show',      className: 'badge-neutral' },
}

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: { data?: string }
}) {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  // Parse date safely
  const dataFiltro = searchParams.data
    ? new Date(searchParams.data + 'T12:00:00')
    : new Date()

  const inicio = new Date(dataFiltro)
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(dataFiltro)
  fim.setHours(23, 59, 59, 999)

  const lista = await db
    .select({
      id: agendamentos.id,
      dataHoraInicio: agendamentos.dataHoraInicio,
      status: agendamentos.status,
      precoTotal: agendamentos.precoTotal,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      servicoNome: servicos.nome,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
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

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Agendamentos</h1>
        <Link href="/admin/agendamentos/novo" className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" />
          Novo
        </Link>
      </div>

      {/* Client component handles the date onChange */}
      <FiltroData dataAtual={dataStr} total={lista.length} />

      <div className="space-y-2">
        {lista.length === 0 ? (
          <div className="card text-center py-12">
            <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum agendamento nesta data</p>
            <Link href="/admin/agendamentos/novo" className="btn-primary mt-4 mx-auto text-xs px-4 py-2">
              + Criar agendamento
            </Link>
          </div>
        ) : (
          lista.map(ag => {
            const status = STATUS_LABELS[ag.status ?? 'pendente']
            return (
              <Link
                key={ag.id}
                href={`/admin/agendamentos/${ag.id}`}
                className="card !p-4 hover:border-orange-200 hover:shadow-md transition-all block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">
                        {ag.dataHoraInicio
                          ? new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                      <span className={status.className}>{status.label}</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{ag.clienteNome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ag.servicoNome}</p>
                    {ag.veiculoPlaca && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        🚗 {ag.veiculoPlaca}{ag.veiculoModelo ? ` · ${ag.veiculoModelo}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600 text-sm">
                      {formatCurrency(parseFloat(ag.precoTotal))}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{ag.clienteTelefone}</p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
