import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, lojas } from '@/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import Link from 'next/link'
import { CalendarDays, Car, ChevronRight, Sparkles } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente:     { label: 'Pendente',     className: 'badge-warning' },
  confirmado:   { label: 'Confirmado',   className: 'badge-info' },
  em_andamento: { label: 'Em Andamento', className: 'badge-info' },
  concluido:    { label: 'Concluído',    className: 'badge-success' },
  cancelado:    { label: 'Cancelado',    className: 'badge-danger' },
}

export default async function ClienteHome() {
  const session = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId = session!.user.lojaId!

  const agora = new Date()

  const [proximosAgs, loja] = await Promise.all([
    db.select({
      id: agendamentos.id,
      dataHoraInicio: agendamentos.dataHoraInicio,
      status: agendamentos.status,
      precoTotal: agendamentos.precoTotal,
      servicoNome: servicos.nome,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(
      eq(agendamentos.clienteId, clienteId),
      eq(agendamentos.lojaId, lojaId),
      gte(agendamentos.dataHoraInicio, agora),
    ))
    .orderBy(agendamentos.dataHoraInicio)
    .limit(3),

    db.select({ nome: lojas.nome, corPrimaria: lojas.corPrimaria })
      .from(lojas).where(eq(lojas.id, lojaId)).limit(1),
  ])

  const nomeLoja = loja[0]?.nome ?? 'TRUXZ'
  const nomeUsuario = session!.user.name.split(' ')[0]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-orange-200 text-sm">Olá,</p>
            <h1 className="text-white text-xl font-bold">{nomeUsuario} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{nomeUsuario[0]}</span>
          </div>
        </div>
        <p className="text-orange-100 text-sm">{nomeLoja}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-4">
        {/* Agendar CTA */}
        <Link href="/cliente/agendar"
          className="block bg-white rounded-2xl shadow-lg p-4 border border-orange-100 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Novo Agendamento</p>
                <p className="text-xs text-gray-500 mt-0.5">Escolha o serviço e horário</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </Link>

        {/* Próximos agendamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Próximos</h2>
            <Link href="/cliente/historico" className="text-xs text-orange-600 font-medium">Ver todos</Link>
          </div>

          {proximosAgs.length === 0 ? (
            <div className="card text-center py-8">
              <Car className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum agendamento futuro</p>
              <Link href="/cliente/agendar" className="btn-primary mt-3 mx-auto text-xs px-4 py-2">
                Agendar agora
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {proximosAgs.map(ag => {
                const status = STATUS_LABELS[ag.status ?? 'pendente']
                return (
                  <Link key={ag.id} href={`/cliente/agendamento/${ag.id}`}
                    className="card !p-4 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{ag.servicoNome}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ag.dataHoraInicio ? formatDateTime(ag.dataHoraInicio) : '--'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={status.className}>{status.label}</span>
                        <p className="text-sm font-bold text-orange-600 mt-1">
                          {formatCurrency(parseFloat(ag.precoTotal))}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Promo */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">Carro sempre impecável</p>
            <p className="text-gray-400 text-xs mt-0.5">Agende regularmente e mantenha seu carro em perfeito estado</p>
          </div>
        </div>
      </div>
    </div>
  )
}
