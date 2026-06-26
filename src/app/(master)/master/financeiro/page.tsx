import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { assinaturas, lojas, planos } from '@/db/schema'
import { eq, sql, count, desc } from 'drizzle-orm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Store, TrendingUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1.25rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.4), transparent)' }

export default async function MasterFinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return null

  const [mrr, totalLojas, inadimplentes, ultimas] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${planos.preco}), 0)` })
      .from(lojas).leftJoin(planos, eq(lojas.planoId, planos.id)).where(eq(lojas.status, 'ativa')),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'suspensa')),
    db.select({ lojaId: assinaturas.lojaId, lojaNome: lojas.nome, status: assinaturas.status, planoNome: planos.nome, preco: planos.preco, proximo: assinaturas.proximoVencimento, criadoEm: assinaturas.criadoEm })
      .from(assinaturas)
      .leftJoin(lojas, eq(assinaturas.lojaId, lojas.id))
      .leftJoin(planos, eq(assinaturas.planoId, planos.id))
      .orderBy(desc(assinaturas.criadoEm))
      .limit(20),
  ])

  const mrrVal = parseFloat(mrr[0]?.total || '0')
  const STATUS_PAG: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
    pago: 'green', pendente: 'amber', cancelado: 'red', vencido: 'red',
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <h1 className="text-xl font-black text-white">Financeiro da Plataforma</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="col-span-2 lg:col-span-1" style={card}>
          <div style={shimmer} />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#34D399' }} />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(mrrVal)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>MRR (Receita Recorrente Mensal)</p>
          <p className="text-xs font-bold mt-1" style={{ color: '#34D399' }}>
            {formatCurrency(mrrVal * 12)}/ano projetado
          </p>
        </div>

        <div style={card}>
          <div style={shimmer} />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.25)' }}>
            <Store className="w-5 h-5" style={{ color: '#9D4EDD' }} />
          </div>
          <p className="text-2xl font-black text-white">{totalLojas[0].count}</p>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>Lojas Ativas</p>
        </div>

        <div style={card}>
          <div style={shimmer} />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
          </div>
          <p className="text-2xl font-black" style={{ color: '#F87171' }}>{inadimplentes[0].count}</p>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>Suspensas</p>
        </div>
      </div>

      {/* Assinaturas */}
      <div>
        <h2 className="font-black text-white mb-3">Assinaturas Recentes</h2>
        <div className="space-y-2">
          {ultimas.length === 0 ? (
            <div className="py-10 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
              <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: '#55556A' }} />
              <p className="text-sm" style={{ color: '#A0A0B8' }}>Nenhuma assinatura ainda</p>
            </div>
          ) : ultimas.map((a, i) => (
            <div key={i} style={card}>
              <div style={shimmer} />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{a.lojaNome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.planoNome && <Badge variant="neutral">{a.planoNome}</Badge>}
                    {a.proximo && <span className="text-xs" style={{ color: '#55556A' }}>vence {formatDate(a.proximo)}</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-black text-sm" style={{ color: '#C77DFF' }}>
                    {a.preco ? formatCurrency(parseFloat(a.preco)) : '-'}
                  </p>
                  <div className="mt-1">
                    <Badge variant={STATUS_PAG[a.status ?? 'pendente']}>{a.status ?? 'pendente'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
