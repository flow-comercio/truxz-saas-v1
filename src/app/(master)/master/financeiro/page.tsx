import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { assinaturas, lojas, planos } from '@/db/schema'
import { eq, sql, count, desc } from 'drizzle-orm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Store, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Gauge } from '@/components/ui/gauge'

const STATUS_BAR: Record<string, string> = {
  pago: '#34C759', pendente: '#FF9F0A', cancelado: '#FF375F', vencido: '#FF375F',
}
const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
  pago: 'green', pendente: 'amber', cancelado: 'red', vencido: 'red',
}

export default async function MasterFinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return null

  const [mrr, totalLojas, inadimplentes, ultimas] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${planos.preco}), 0)` })
      .from(lojas).leftJoin(planos, eq(lojas.planoId, planos.id)).where(eq(lojas.status, 'ativa')),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'suspensa')),
    db.select({
      lojaId: assinaturas.lojaId, lojaNome: lojas.nome, status: assinaturas.status,
      planoNome: planos.nome, preco: planos.preco, proximo: assinaturas.proximoVencimento,
    })
      .from(assinaturas)
      .leftJoin(lojas, eq(assinaturas.lojaId, lojas.id))
      .leftJoin(planos, eq(assinaturas.planoId, planos.id))
      .orderBy(desc(assinaturas.criadoEm))
      .limit(20),
  ])

  const mrrVal  = parseFloat(mrr[0]?.total || '0')
  const arrVal  = mrrVal * 12
  const metaMrr = Math.max(mrrVal * 1.25, 5000)

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div>
        <p className="section-tag mb-1">Plataforma</p>
        <h1 className="text-xl font-black text-white">Financeiro</h1>
      </div>

      {/* ── CARD MRR ───────────────────────────────── */}
      <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <Gauge value={Math.round(mrrVal)} max={Math.round(metaMrr)} size={150} unit="R$" sub="MRR mensal" color="purple" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">recorrência</p>
        </div>
        <div className="flex-1 w-full space-y-3">
          <div>
            <p className="text-3xl font-black text-white">{formatCurrency(mrrVal)}</p>
            <p className="text-xs text-white/30 mt-0.5">por mês</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#34C759]" />
              <span className="text-xs text-white/40">ARR projetado</span>
            </div>
            <span className="font-black text-sm text-[#34C759]">{formatCurrency(arrVal)}</span>
          </div>
        </div>
      </div>

      {/* ── STATS LOJAS ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.25)' }}>
            <Store className="w-4.5 h-4.5 text-[#9D4EDD]" />
          </div>
          <p className="text-2xl font-black text-white">{totalLojas[0].count}</p>
          <p className="text-xs text-white/30 mt-0.5">Lojas Ativas</p>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.25)' }}>
            <AlertCircle className="w-4.5 h-4.5 text-[#FF375F]" />
          </div>
          <p className="text-2xl font-black text-[#FF375F]">{inadimplentes[0].count}</p>
          <p className="text-xs text-white/30 mt-0.5">Suspensas</p>
        </div>
      </div>

      {/* ── ASSINATURAS ────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 pl-1">
          Assinaturas Recentes
        </p>
        {ultimas.length === 0 ? (
          <div className="text-center py-10 card">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-white/15" />
            <p className="text-sm text-white/30">Nenhuma assinatura ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ultimas.map((a, i) => {
              const barColor = STATUS_BAR[a.status ?? 'pendente'] ?? '#55556A'
              return (
                <div key={i} className="card p-0 overflow-hidden flex">
                  <div className="w-1 flex-shrink-0" style={{ background: barColor }} />
                  <div className="flex-1 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{a.lojaNome}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {a.planoNome && <Badge variant="neutral">{a.planoNome}</Badge>}
                        {a.proximo && (
                          <span className="text-[10px] text-white/25">vence {formatDate(a.proximo)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-sm text-[#C77DFF]">
                        {a.preco ? formatCurrency(parseFloat(a.preco)) : '—'}
                      </p>
                      <div className="mt-1">
                        <Badge variant={STATUS_BADGE[a.status ?? 'pendente']}>
                          {a.status ?? 'pendente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
