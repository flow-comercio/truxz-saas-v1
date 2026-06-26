import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { ordensServico, usuarios, veiculos } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, Car, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_OS: Record<string, {
  label: string
  variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' | 'blue'
  barColor: string
}> = {
  aberta:               { label: 'Aberta',         variant: 'amber',   barColor: '#FF9F0A' },
  diagnostico:          { label: 'Diagnóstico',    variant: 'amber',   barColor: '#FF9F0A' },
  aguardando_aprovacao: { label: 'Ag. Aprovação',  variant: 'amber',   barColor: '#FF9F0A' },
  aprovada:             { label: 'Aprovada',        variant: 'purple',  barColor: '#9D4EDD' },
  em_execucao:          { label: 'Em Execução',     variant: 'purple',  barColor: '#3F8EFF' },
  aguardando_peca:      { label: 'Ag. Peça',       variant: 'neutral', barColor: '#55556A' },
  concluida:            { label: 'Concluída',       variant: 'green',   barColor: '#34C759' },
  cancelada:            { label: 'Cancelada',       variant: 'red',     barColor: '#FF375F' },
  entregue:             { label: 'Entregue',        variant: 'green',   barColor: '#34C759' },
}

export default async function OsPage() {
  const session = await getServerSession(authOptions)
  const lojaId  = session!.user.lojaId!

  const rows = await db
    .select({
      id:              ordensServico.id,
      numero:          ordensServico.numero,
      status:          ordensServico.status,
      total:           ordensServico.total,
      placaLida:       ordensServico.placaLida,
      criadoEm:        ordensServico.criadoEm,
      previsaoEntrega: ordensServico.previsaoEntrega,
      clienteNome:     usuarios.nome,
      veiculoPlaca:    veiculos.placa,
      veiculoModelo:   veiculos.modelo,
    })
    .from(ordensServico)
    .leftJoin(usuarios, eq(ordensServico.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(ordensServico.veiculoId, veiculos.id))
    .where(eq(ordensServico.lojaId, lojaId))
    .orderBy(desc(ordensServico.criadoEm))
    .limit(50)

  const FINAIS     = ['concluida', 'cancelada', 'entregue']
  const abertas    = rows.filter(r => !FINAIS.includes(r.status ?? ''))
  const finalizadas = rows.filter(r => FINAIS.includes(r.status ?? ''))

  const receitaTotal = finalizadas
    .filter(r => r.status !== 'cancelada')
    .reduce((s, r) => s + parseFloat(r.total ?? '0'), 0)

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Operacional</p>
          <h1 className="text-xl font-black text-white">Ordens de Serviço</h1>
        </div>
        <Link href="/admin/os/nova" className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Nova OS
        </Link>
      </div>

      {/* ── STATS ──────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Em aberto',    value: abertas.length,    color: '#FF9F0A' },
            { label: 'Finalizadas',  value: finalizadas.length, color: '#34C759' },
            { label: 'Receita OS',   value: formatCurrency(receitaTotal), color: '#C77DFF' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-wide mt-0.5" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── EM ABERTO ──────────────────────────────── */}
      {abertas.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 pl-1">Em andamento</p>
          <div className="space-y-2">
            {abertas.map(os => {
              const s = STATUS_OS[os.status ?? 'aberta'] ?? STATUS_OS.aberta
              return (
                <Link key={os.id} href={`/admin/os/${os.id}`}>
                  <div className="card p-0 overflow-hidden flex active:scale-[0.99] transition-all">
                    <div className="w-1 flex-shrink-0" style={{ background: s.barColor }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-white/25">OS #{os.numero}</span>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </div>
                          <p className="font-black text-white">{os.clienteNome ?? 'Sem cliente'}</p>
                          <p className="text-xs text-white/35 mt-0.5 flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {os.veiculoPlaca ?? os.placaLida ?? '—'}
                            {os.veiculoModelo ? ` · ${os.veiculoModelo}` : ''}
                          </p>
                          <p className="text-[10px] text-white/20 mt-1">{formatDateTime(os.criadoEm!)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-[#C77DFF]">{formatCurrency(parseFloat(os.total ?? '0'))}</p>
                          {os.previsaoEntrega && (
                            <p className="text-[10px] text-white/25 mt-1 flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(os.previsaoEntrega).toLocaleDateString('pt-BR')}
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
        </div>
      )}

      {/* ── FINALIZADAS ────────────────────────────── */}
      {finalizadas.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 pl-1">Finalizadas</p>
          <div className="space-y-2 opacity-50">
            {finalizadas.map(os => {
              const s = STATUS_OS[os.status ?? 'concluida'] ?? STATUS_OS.concluida
              return (
                <Link key={os.id} href={`/admin/os/${os.id}`}>
                  <div className="card p-0 overflow-hidden flex">
                    <div className="w-1 flex-shrink-0" style={{ background: s.barColor }} />
                    <div className="flex-1 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/25">OS #{os.numero}</span>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5">{os.clienteNome ?? '—'}</p>
                        <p className="text-[10px] text-white/25">{os.veiculoPlaca ?? os.placaLida ?? '—'}</p>
                      </div>
                      <p className="font-black text-sm text-[#C77DFF] flex-shrink-0">
                        {formatCurrency(parseFloat(os.total ?? '0'))}
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
          <p className="font-bold text-white/35 mb-4">Nenhuma OS ainda</p>
          <Link href="/admin/os/nova" className="btn-primary mx-auto px-6">
            Criar primeira OS
          </Link>
        </div>
      )}
    </div>
  )
}
