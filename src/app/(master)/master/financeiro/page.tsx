import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { assinaturas, lojas, planos, pagamentos } from '@/db/schema'
import { eq, sql, count, desc } from 'drizzle-orm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Store, TrendingUp, AlertCircle } from 'lucide-react'

export default async function MasterFinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return null

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [mrr, totalLojas, inadimplentes, ultimas] = await Promise.all([
    // MRR = soma dos planos das lojas ativas
    db.select({ total: sql<string>`COALESCE(SUM(${planos.preco}), 0)` })
      .from(lojas)
      .leftJoin(planos, eq(lojas.planoId, planos.id))
      .where(eq(lojas.status, 'ativa')),

    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),

    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'suspensa')),

    db.select({
      lojaId:   assinaturas.lojaId,
      lojaNome: lojas.nome,
      status:   assinaturas.status,
      planoNome: planos.nome,
      preco:     planos.preco,
      proximo:   assinaturas.proximoVencimento,
      criadoEm: assinaturas.criadoEm,
    })
    .from(assinaturas)
    .leftJoin(lojas,  eq(assinaturas.lojaId,  lojas.id))
    .leftJoin(planos, eq(assinaturas.planoId, planos.id))
    .orderBy(desc(assinaturas.criadoEm))
    .limit(20),
  ])

  const mrrVal = parseFloat(mrr[0]?.total || '0')

  const STATUS_PAG: Record<string, string> = {
    pago:     'badge-success',
    pendente: 'badge-warning',
    cancelado:'badge-danger',
    vencido:  'badge-danger',
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Financeiro da Plataforma</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="card col-span-2 lg:col-span-1">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(mrrVal)}</p>
          <p className="text-xs text-gray-500 mt-0.5">MRR (Receita Recorrente Mensal)</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {formatCurrency(mrrVal * 12)}/ano projetado
          </p>
        </div>

        <div className="card">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLojas[0].count}</p>
          <p className="text-xs text-gray-500 mt-0.5">Lojas Ativas</p>
        </div>

        <div className="card">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{inadimplentes[0].count}</p>
          <p className="text-xs text-gray-500 mt-0.5">Suspensas</p>
        </div>
      </div>

      {/* Assinaturas */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Assinaturas Recentes</h2>
        <div className="space-y-2">
          {ultimas.length === 0 ? (
            <div className="card text-center py-8">
              <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhuma assinatura ainda</p>
            </div>
          ) : ultimas.map((a, i) => (
            <div key={i} className="card !p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{a.lojaNome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.planoNome && <span className="badge-neutral">{a.planoNome}</span>}
                    {a.proximo && (
                      <span className="text-xs text-gray-400">
                        vence {formatDate(a.proximo)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-gray-900 text-sm">
                    {a.preco ? formatCurrency(parseFloat(a.preco)) : '-'}
                  </p>
                  <span className={STATUS_PAG[a.status ?? 'pendente']}>
                    {a.status ?? 'pendente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
