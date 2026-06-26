import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orcamentos, usuarios, veiculos } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_ORC: Record<string, {
  label: string
  variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral'
  barColor: string
}> = {
  rascunho:   { label: 'Rascunho',  variant: 'neutral', barColor: '#55556A' },
  enviado:    { label: 'Enviado',   variant: 'amber',   barColor: '#FF9F0A' },
  aprovado:   { label: 'Aprovado',  variant: 'green',   barColor: '#34C759' },
  recusado:   { label: 'Recusado',  variant: 'red',     barColor: '#FF375F' },
  expirado:   { label: 'Expirado',  variant: 'red',     barColor: '#FF375F' },
  convertido: { label: 'Virou OS',  variant: 'purple',  barColor: '#9D4EDD' },
}

export default async function OrcamentosPage() {
  const session = await getServerSession(authOptions)
  const lojaId  = session!.user.lojaId!

  const rows = await db
    .select({
      id:          orcamentos.id,
      numero:      orcamentos.numero,
      status:      orcamentos.status,
      total:       orcamentos.total,
      validoAte:   orcamentos.validoAte,
      criadoEm:    orcamentos.criadoEm,
      clienteNome: usuarios.nome,
      veiculoPlaca: veiculos.placa,
    })
    .from(orcamentos)
    .leftJoin(usuarios, eq(orcamentos.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(orcamentos.veiculoId, veiculos.id))
    .where(eq(orcamentos.lojaId, lojaId))
    .orderBy(desc(orcamentos.criadoEm))
    .limit(50)

  const FINAIS   = ['convertido', 'recusado', 'expirado']
  const ativos   = rows.filter(r => !FINAIS.includes(r.status ?? ''))
  const historico = rows.filter(r => FINAIS.includes(r.status ?? ''))

  const agora = new Date()
  const totalAprovados = rows.filter(r => r.status === 'aprovado').reduce((s, r) => s + parseFloat(r.total ?? '0'), 0)

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Comercial</p>
          <h1 className="text-xl font-black text-white">Orçamentos</h1>
        </div>
        <Link href="/admin/orcamentos/novo" className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Novo Orçamento
        </Link>
      </div>

      {/* ── STATS ──────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ativos',    value: ativos.length,    color: '#9D4EDD' },
            { label: 'Aprovados', value: rows.filter(r => r.status === 'aprovado').length, color: '#34C759' },
            { label: 'Em aberto', value: formatCurrency(totalAprovados), color: '#C77DFF' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-wide mt-0.5" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── ATIVOS ─────────────────────────────────── */}
      {ativos.length > 0 && (
        <div className="space-y-2">
          {ativos.map(o => {
            const s       = STATUS_ORC[o.status ?? 'rascunho'] ?? STATUS_ORC.rascunho
            const vencido = o.validoAte && new Date(o.validoAte) < agora
            const diasRestantes = o.validoAte
              ? Math.ceil((new Date(o.validoAte).getTime() - agora.getTime()) / 86400000)
              : null

            return (
              <Link key={o.id} href={`/admin/orcamentos/${o.id}`}>
                <div className="card p-0 overflow-hidden flex active:scale-[0.99] transition-all">
                  <div className="w-1 flex-shrink-0" style={{ background: vencido ? '#FF375F' : s.barColor }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-white/25">ORC #{o.numero}</span>
                          <Badge variant={vencido ? 'red' : s.variant}>{vencido ? 'Vencido' : s.label}</Badge>
                        </div>
                        <p className="font-black text-white">{o.clienteNome ?? 'Sem cliente'}</p>
                        {o.veiculoPlaca && (
                          <p className="text-xs text-white/35 mt-0.5">{o.veiculoPlaca}</p>
                        )}
                        <p className="text-[10px] text-white/20 mt-1">{formatDateTime(o.criadoEm!)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-[#C77DFF]">{formatCurrency(parseFloat(o.total ?? '0'))}</p>
                        {o.validoAte && (
                          <p className="text-[10px] mt-1 flex items-center justify-end gap-1"
                            style={{ color: vencido ? '#FF375F' : diasRestantes !== null && diasRestantes <= 3 ? '#FF9F0A' : '#55556A' }}>
                            <Clock className="w-3 h-3" />
                            {vencido
                              ? 'Vencido'
                              : diasRestantes !== null && diasRestantes <= 3
                                ? `${diasRestantes}d restantes`
                                : new Date(o.validoAte).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── HISTÓRICO ──────────────────────────────── */}
      {historico.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 pl-1">Histórico</p>
          <div className="space-y-2 opacity-50">
            {historico.map(o => {
              const s = STATUS_ORC[o.status ?? 'expirado'] ?? STATUS_ORC.expirado
              return (
                <Link key={o.id} href={`/admin/orcamentos/${o.id}`}>
                  <div className="card p-0 overflow-hidden flex">
                    <div className="w-1 flex-shrink-0" style={{ background: s.barColor }} />
                    <div className="flex-1 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/25">ORC #{o.numero}</span>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5">{o.clienteNome ?? '—'}</p>
                      </div>
                      <p className="font-black text-sm text-[#C77DFF] flex-shrink-0">
                        {formatCurrency(parseFloat(o.total ?? '0'))}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── EMPTY ──────────────────────────────────── */}
      {rows.length === 0 && (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(157,78,221,0.06)' }}>
            <FileText className="w-8 h-8 text-white/15" />
          </div>
          <p className="font-bold text-white/35 mb-4">Nenhum orçamento ainda</p>
          <Link href="/admin/orcamentos/novo" className="btn-primary mx-auto px-6">
            Criar primeiro orçamento
          </Link>
        </div>
      )}
    </div>
  )
}
