import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { pagamentos, agendamentos, servicos, usuarios, vendas } from '@/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CreditCard, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Gauge } from '@/components/ui/gauge'

const STATUS_PAG: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
  pago: 'green', pendente: 'amber', cancelado: 'red', estornado: 'neutral',
}
const STATUS_VENDA: Record<string, 'green' | 'amber' | 'red' | 'neutral'> = {
  finalizada: 'green', aberta: 'amber', cancelada: 'red', estornada: 'neutral',
}

const METODO_MAP: Record<string, string> = {
  dinheiro: 'Dinheiro', cartao_credito: 'Crédito', cartao_debito: 'Débito',
  pix: 'Pix', transferencia: 'Transferência',
}

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions)
  const lojaId  = session!.user.lojaId!

  const inicioMes         = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
  const inicioMesAnterior = new Date(inicioMes); inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1)

  const [
    receitaAgMes, receitaAgAnterior,
    receitaVendasMes, receitaVendasAnterior,
    ultimosPagamentos, ultimasVendas,
  ] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMes))),

    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMesAnterior), sql`${pagamentos.pagoEm} < ${inicioMes}`)),

    db.select({ total: sql<string>`COALESCE(SUM(${vendas.total}), 0)` })
      .from(vendas)
      .where(and(eq(vendas.lojaId, lojaId), eq(vendas.status, 'finalizada'), gte(vendas.finalizadoEm, inicioMes))),

    db.select({ total: sql<string>`COALESCE(SUM(${vendas.total}), 0)` })
      .from(vendas)
      .where(and(eq(vendas.lojaId, lojaId), eq(vendas.status, 'finalizada'), gte(vendas.finalizadoEm, inicioMesAnterior), sql`${vendas.finalizadoEm} < ${inicioMes}`)),

    db.select({
      id: pagamentos.id, valor: pagamentos.valor, status: pagamentos.status,
      metodo: pagamentos.metodo, pagoEm: pagamentos.pagoEm, criadoEm: pagamentos.criadoEm,
      servicoNome: servicos.nome, clienteNome: usuarios.nome,
    })
      .from(pagamentos)
      .innerJoin(agendamentos, eq(pagamentos.agendamentoId, agendamentos.id))
      .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
      .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
      .where(eq(pagamentos.lojaId, lojaId))
      .orderBy(desc(pagamentos.criadoEm))
      .limit(8),

    db.select({
      id: vendas.id, total: vendas.total, status: vendas.status,
      metodo: vendas.metodo, finalizadoEm: vendas.finalizadoEm, numero: vendas.numero,
    })
      .from(vendas)
      .where(eq(vendas.lojaId, lojaId))
      .orderBy(desc(vendas.finalizadoEm))
      .limit(8),
  ])

  const receitaAg    = parseFloat(receitaAgMes[0]?.total    || '0')
  const receitaPdv   = parseFloat(receitaVendasMes[0]?.total || '0')
  const receitaMes   = receitaAg + receitaPdv
  const receitaAnt   = parseFloat(receitaAgAnterior[0]?.total || '0') + parseFloat(receitaVendasAnterior[0]?.total || '0')
  const crescimento  = receitaAnt > 0 ? ((receitaMes - receitaAnt) / receitaAnt * 100) : null
  const crescPos     = crescimento !== null && crescimento >= 0

  // Gauge: % da meta (meta = mês anterior * 1.1 ou R$5k mínimo)
  const meta         = Math.max(receitaAnt * 1.1, 5000)
  const gaugeVal     = Math.min(Math.round(receitaMes), Math.round(meta))
  const gaugeMax     = Math.round(meta)

  const mesPtBr      = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div>
        <p className="section-tag mb-1">Gestão</p>
        <h1 className="text-xl font-black text-white">Financeiro</h1>
        <p className="text-xs text-white/35 mt-0.5 capitalize">{mesPtBr}</p>
      </div>

      {/* ── CARD PRINCIPAL: GAUGE + TOTAIS ─────────── */}
      <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge de receita */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Gauge
            value={gaugeVal}
            max={gaugeMax}
            size={150}
            unit="R$"
            sub="faturamento"
            color="purple"
          />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">este mês</p>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full space-y-3">
          {/* Total + crescimento */}
          <div>
            <p className="text-3xl font-black text-white">{formatCurrency(receitaMes)}</p>
            <div className="flex items-center gap-2 mt-1">
              {crescimento !== null ? (
                <div className="flex items-center gap-1 text-xs font-bold"
                  style={{ color: crescPos ? '#34C759' : '#FF375F' }}>
                  {crescPos
                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                    : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(crescimento).toFixed(1)}% vs mês anterior
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-white/25">
                  <Minus className="w-3 h-3" /> Primeiro mês
                </div>
              )}
            </div>
          </div>

          {/* Split agendamentos / PDV */}
          <div className="space-y-2">
            {[
              { label: 'Agendamentos', value: receitaAg,  color: '#9D4EDD', Icon: CreditCard,  total: receitaMes },
              { label: 'PDV / Caixa',  value: receitaPdv, color: '#34C759', Icon: ShoppingCart, total: receitaMes },
            ].map(({ label, value, color, Icon, total }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-xs font-bold text-white/50">{label}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color }}>{formatCurrency(value)}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill"
                    style={{ width: `${total > 0 ? Math.round((value / total) * 100) : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Mês anterior */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs text-white/35">Mês anterior</span>
            </div>
            <span className="text-sm font-black text-white/50">{formatCurrency(receitaAnt)}</span>
          </div>
        </div>
      </div>

      {/* ── PAGAMENTOS DE AGENDAMENTOS ─────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-[#9D4EDD]" />
          <h2 className="font-black text-white text-sm">Pagamentos de Agendamentos</h2>
        </div>
        {ultimosPagamentos.length === 0 ? (
          <div className="text-center py-8 card">
            <CreditCard className="w-7 h-7 mx-auto mb-2 text-white/15" />
            <p className="text-sm text-white/30">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ultimosPagamentos.map(p => (
              <div key={p.id} className="card p-0 overflow-hidden flex">
                {/* Barra lateral */}
                <div className="w-1 flex-shrink-0"
                  style={{ background: p.status === 'pago' ? '#34C759' : p.status === 'cancelado' ? '#FF375F' : '#FF9F0A' }} />
                <div className="flex-1 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{p.clienteNome}</p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{p.servicoNome}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {p.pagoEm ? formatDateTime(p.pagoEm) : formatDateTime(p.criadoEm!)}
                      {p.metodo ? ` · ${METODO_MAP[p.metodo] ?? p.metodo}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-[#C77DFF]">{formatCurrency(parseFloat(p.valor))}</p>
                    <div className="mt-1">
                      <Badge variant={STATUS_PAG[p.status ?? 'pendente']}>{p.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── VENDAS PDV ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-[#34C759]" />
          <h2 className="font-black text-white text-sm">Vendas PDV</h2>
        </div>
        {ultimasVendas.length === 0 ? (
          <div className="text-center py-8 card">
            <ShoppingCart className="w-7 h-7 mx-auto mb-2 text-white/15" />
            <p className="text-sm text-white/30">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ultimasVendas.map(v => (
              <div key={v.id} className="card p-0 overflow-hidden flex">
                <div className="w-1 flex-shrink-0"
                  style={{ background: v.status === 'finalizada' ? '#34C759' : v.status === 'cancelada' ? '#FF375F' : '#FF9F0A' }} />
                <div className="flex-1 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">Venda #{v.numero}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {v.metodo ? METODO_MAP[v.metodo] ?? v.metodo : '—'}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {v.finalizadoEm ? formatDateTime(v.finalizadoEm) : '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-[#34C759]">{formatCurrency(parseFloat(v.total))}</p>
                    <div className="mt-1">
                      <Badge variant={STATUS_VENDA[v.status ?? 'aberta']}>{v.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
