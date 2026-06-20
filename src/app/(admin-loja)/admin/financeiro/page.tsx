import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { pagamentos, agendamentos, servicos, usuarios } from '@/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { DollarSign, TrendingUp, ArrowUpRight, CreditCard } from 'lucide-react'

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const inicioMesAnterior = new Date(inicioMes)
  inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1)

  const [receitaMes, receitaMesAnterior, ultimosPagamentos] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMes))),

    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(
        eq(pagamentos.lojaId, lojaId),
        eq(pagamentos.status, 'pago'),
        gte(pagamentos.pagoEm, inicioMesAnterior),
        sql`${pagamentos.pagoEm} < ${inicioMes}`
      )),

    db.select({
      id: pagamentos.id,
      valor: pagamentos.valor,
      status: pagamentos.status,
      metodo: pagamentos.metodo,
      pagoEm: pagamentos.pagoEm,
      criadoEm: pagamentos.criadoEm,
      servicoNome: servicos.nome,
      clienteNome: usuarios.nome,
    })
    .from(pagamentos)
    .innerJoin(agendamentos, eq(pagamentos.agendamentoId, agendamentos.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .where(eq(pagamentos.lojaId, lojaId))
    .orderBy(desc(pagamentos.criadoEm))
    .limit(20),
  ])

  const receita = parseFloat(receitaMes[0]?.total || '0')
  const receitaAnterior = parseFloat(receitaMesAnterior[0]?.total || '0')
  const crescimento = receitaAnterior > 0
    ? ((receita - receitaAnterior) / receitaAnterior * 100).toFixed(1)
    : null

  const STATUS_PAG: Record<string, string> = {
    pago: 'badge-success',
    pendente: 'badge-warning',
    cancelado: 'badge-danger',
    estornado: 'badge-neutral',
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            {crescimento && (
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {crescimento}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(receita)}</p>
          <p className="text-xs text-gray-500 mt-1">Receita do mês atual</p>
        </div>

        <div className="card">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(receitaAnterior)}</p>
          <p className="text-xs text-gray-500 mt-1">Mês anterior</p>
        </div>
      </div>

      {/* Últimos pagamentos */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Últimos Pagamentos</h2>
        <div className="space-y-2">
          {ultimosPagamentos.length === 0 ? (
            <div className="card text-center py-8">
              <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            ultimosPagamentos.map(p => (
              <div key={p.id} className="card !p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.clienteNome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.servicoNome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.pagoEm ? formatDateTime(p.pagoEm) : formatDateTime(p.criadoEm!)}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(parseFloat(p.valor))}</p>
                    <span className={`${STATUS_PAG[p.status ?? 'pendente']} mt-1 inline-block`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
