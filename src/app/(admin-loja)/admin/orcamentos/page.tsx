import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orcamentos, usuarios, veiculos } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_ORC: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' }> = {
  rascunho:   { label: 'Rascunho',   variant: 'neutral' },
  enviado:    { label: 'Enviado',    variant: 'amber' },
  aprovado:   { label: 'Aprovado',   variant: 'green' },
  recusado:   { label: 'Recusado',   variant: 'red' },
  expirado:   { label: 'Expirado',   variant: 'red' },
  convertido: { label: 'Virou OS',   variant: 'purple' },
}

export default async function OrcamentosPage() {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const rows = await db
    .select({
      id: orcamentos.id,
      numero: orcamentos.numero,
      status: orcamentos.status,
      total: orcamentos.total,
      validoAte: orcamentos.validoAte,
      criadoEm: orcamentos.criadoEm,
      clienteNome: usuarios.nome,
      veiculoPlaca: veiculos.placa,
    })
    .from(orcamentos)
    .leftJoin(usuarios, eq(orcamentos.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(orcamentos.veiculoId, veiculos.id))
    .where(eq(orcamentos.lojaId, lojaId))
    .orderBy(desc(orcamentos.criadoEm))
    .limit(50)

  const ativos = rows.filter(r => !['convertido', 'recusado', 'expirado'].includes(r.status ?? ''))
  const historico = rows.filter(r => ['convertido', 'recusado', 'expirado'].includes(r.status ?? ''))

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Orçamentos</h1>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>{ativos.length} ativos</p>
        </div>
        <Link href="/admin/orcamentos/novo" className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Novo Orçamento
        </Link>
      </div>

      {ativos.length > 0 && (
        <div className="space-y-2">
          {ativos.map(o => {
            const s = STATUS_ORC[o.status ?? 'rascunho']
            const vencido = o.validoAte && new Date(o.validoAte) < new Date()
            return (
              <Link key={o.id} href={`/admin/orcamentos/${o.id}`}
                className="block p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: '#55556A' }}>ORC #{o.numero}</span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    <p className="font-bold text-white mt-1">{o.clienteNome ?? 'Sem cliente'}</p>
                    {o.veiculoPlaca && <p className="text-sm" style={{ color: '#A0A0B8' }}>{o.veiculoPlaca}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-black" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(o.total ?? '0'))}</p>
                    {o.validoAte && (
                      <p className="text-xs mt-1 flex items-center justify-end gap-1" style={{ color: vencido ? '#F87171' : '#55556A' }}>
                        <Clock className="w-3 h-3" />
                        {vencido ? 'Vencido' : `Válido até ${new Date(o.validoAte).toLocaleDateString('pt-BR')}`}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#55556A' }}>{formatDateTime(o.criadoEm!)}</p>
              </Link>
            )
          })}
        </div>
      )}

      {historico.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Histórico</p>
          <div className="space-y-2">
            {historico.map(o => {
              const s = STATUS_ORC[o.status ?? 'expirado']
              return (
                <Link key={o.id} href={`/admin/orcamentos/${o.id}`}
                  className="block p-3 rounded-2xl opacity-60"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: '#55556A' }}>ORC #{o.numero}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">{o.clienteNome ?? '—'}</p>
                    </div>
                    <p className="font-black text-sm" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(o.total ?? '0'))}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#55556A' }} />
          <p className="font-semibold" style={{ color: '#A0A0B8' }}>Nenhum orçamento ainda</p>
          <Link href="/admin/orcamentos/novo" className="btn-primary mt-4 mx-auto inline-flex text-xs px-4 py-2">
            Criar primeiro orçamento
          </Link>
        </div>
      )}
    </div>
  )
}
