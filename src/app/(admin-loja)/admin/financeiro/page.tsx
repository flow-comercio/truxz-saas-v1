import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { pagamentos, agendamentos, servicos, usuarios, vendas } from '@/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { DollarSign, TrendingUp, ArrowUpRight, CreditCard, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1.25rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.4), transparent)' }

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const inicioMes = new Date()
  inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
  const inicioMesAnterior = new Date(inicioMes)
  inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1)
  const fimMesAnterior = new Date(inicioMes)
  fimMesAnterior.setMilliseconds(-1)

  const [
    receitaAgMes, receitaAgAnterior,
    receitaVendasMes, receitaVendasAnterior,
    ultimosPagamentos, ultimasVendas,
  ] = await Promise.all([
    // Agendamentos (pagamentos) mês atual
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMes))),

    // Agendamentos mês anterior
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMesAnterior), sql`${pagamentos.pagoEm} < ${inicioMes}`)),

    // PDV (vendas) mês atual
    db.select({ total: sql<string>`COALESCE(SUM(${vendas.total}), 0)` })
      .from(vendas)
      .where(and(eq(vendas.lojaId, lojaId), eq(vendas.status, 'finalizada'), gte(vendas.finalizadoEm, inicioMes))),

    // PDV mês anterior
    db.select({ total: sql<string>`COALESCE(SUM(${vendas.total}), 0)` })
      .from(vendas)
      .where(and(eq(vendas.lojaId, lojaId), eq(vendas.status, 'finalizada'), gte(vendas.finalizadoEm, inicioMesAnterior), sql`${vendas.finalizadoEm} < ${inicioMes}`)),

    // Últimos pagamentos de agendamentos
    db.select({ id: pagamentos.id, valor: pagamentos.valor, status: pagamentos.status, metodo: pagamentos.metodo, pagoEm: pagamentos.pagoEm, criadoEm: pagamentos.criadoEm, servicoNome: servicos.nome, clienteNome: usuarios.nome })
      .from(pagamentos)
      .innerJoin(agendamentos, eq(pagamentos.agendamentoId, agendamentos.id))
      .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
      .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
      .where(eq(pagamentos.lojaId, lojaId))
      .orderBy(desc(pagamentos.criadoEm))
      .limit(10),

    // Últimas vendas PDV
    db.select({ id: vendas.id, total: vendas.total, status: vendas.status, metodo: vendas.metodo, finalizadoEm: vendas.finalizadoEm, numero: vendas.numero })
      .from(vendas)
      .where(eq(vendas.lojaId, lojaId))
      .orderBy(desc(vendas.finalizadoEm))
      .limit(10),
  ])

  const receitaMes = parseFloat(receitaAgMes[0]?.total || '0') + parseFloat(receitaVendasMes[0]?.total || '0')
  const receitaAnterior = parseFloat(receitaAgAnterior[0]?.total || '0') + parseFloat(receitaVendasAnterior[0]?.total || '0')
  const receitaAgMesNum = parseFloat(receitaAgMes[0]?.total || '0')
  const receitaPdvMesNum = parseFloat(receitaVendasMes[0]?.total || '0')
  const crescimento = receitaAnterior > 0 ? ((receitaMes - receitaAnterior) / receitaAnterior * 100).toFixed(1) : null

  const STATUS_PAG: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
    pago: 'green', pendente: 'amber', cancelado: 'red', estornado: 'neutral',
  }
  const STATUS_VENDA: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
    finalizada: 'green', aberta: 'amber', cancelada: 'red', estornada: 'neutral',
  }

  return (
    <div className="p-4 lg:p-6 space-y-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <h1 className="text-xl font-black text-white">Financeiro</h1>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2" style={card}>
          <div style={shimmer} />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(157,78,221,0.12)', border: '1px solid rgba(157,78,221,0.25)' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#9D4EDD' }} />
            </div>
            {crescimento && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#34D399' }}>
                <ArrowUpRight className="w-3.5 h-3.5" />{crescimento}%
              </div>
            )}
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(receitaMes)}</p>
          <p className="text-xs mt-1" style={{ color: '#55556A' }}>Receita total do mês (agendamentos + PDV)</p>
        </div>

        <div style={card}>
          <div style={shimmer} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(199,125,255,0.08)', border: '1px solid rgba(199,125,255,0.2)' }}>
            <CreditCard className="w-4 h-4" style={{ color: '#C77DFF' }} />
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(receitaAgMesNum)}</p>
          <p className="text-xs mt-1" style={{ color: '#55556A' }}>Agendamentos</p>
        </div>

        <div style={card}>
          <div style={shimmer} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <ShoppingCart className="w-4 h-4" style={{ color: '#4ADE80' }} />
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(receitaPdvMesNum)}</p>
          <p className="text-xs mt-1" style={{ color: '#55556A' }}>PDV / Caixa</p>
        </div>

        <div className="col-span-2" style={card}>
          <div style={shimmer} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#9D4EDD' }} />
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(receitaAnterior)}</p>
          <p className="text-xs mt-1" style={{ color: '#55556A' }}>Mês anterior (total)</p>
        </div>
      </div>

      {/* Últimos pagamentos de agendamentos */}
      <div>
        <h2 className="font-black text-white mb-3">Pagamentos de Agendamentos</h2>
        <div className="space-y-2">
          {ultimosPagamentos.length === 0 ? (
            <div className="py-8 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
              <CreditCard className="w-7 h-7 mx-auto mb-2" style={{ color: '#55556A' }} />
              <p className="text-sm" style={{ color: '#A0A0B8' }}>Nenhum pagamento encontrado</p>
            </div>
          ) : ultimosPagamentos.map(p => (
            <div key={p.id} style={card}>
              <div style={shimmer} />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{p.clienteNome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>{p.servicoNome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
                    {p.pagoEm ? formatDateTime(p.pagoEm) : formatDateTime(p.criadoEm!)}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <p className="font-black text-sm" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(p.valor))}</p>
                  <div className="mt-1"><Badge variant={STATUS_PAG[p.status ?? 'pendente']}>{p.status}</Badge></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas vendas PDV */}
      <div>
        <h2 className="font-black text-white mb-3">Vendas PDV</h2>
        <div className="space-y-2">
          {ultimasVendas.length === 0 ? (
            <div className="py-8 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
              <ShoppingCart className="w-7 h-7 mx-auto mb-2" style={{ color: '#55556A' }} />
              <p className="text-sm" style={{ color: '#A0A0B8' }}>Nenhuma venda encontrada</p>
            </div>
          ) : ultimasVendas.map(v => (
            <div key={v.id} style={card}>
              <div style={shimmer} />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">Venda #{v.numero}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>{v.metodo?.replace('_', ' ')}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
                    {v.finalizadoEm ? formatDateTime(v.finalizadoEm) : '—'}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <p className="font-black text-sm" style={{ color: '#4ADE80' }}>{formatCurrency(parseFloat(v.total))}</p>
                  <div className="mt-1"><Badge variant={STATUS_VENDA[v.status ?? 'aberta']}>{v.status}</Badge></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
