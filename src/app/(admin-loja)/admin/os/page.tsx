import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { ordensServico, usuarios, veiculos } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Wrench, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_OS: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' | 'blue' }> = {
  aberta:                { label: 'Aberta',              variant: 'amber' },
  diagnostico:           { label: 'Diagnóstico',         variant: 'amber' },
  aguardando_aprovacao:  { label: 'Ag. Aprovação',       variant: 'amber' },
  aprovada:              { label: 'Aprovada',             variant: 'purple' },
  em_execucao:           { label: 'Em Execução',          variant: 'purple' },
  aguardando_peca:       { label: 'Ag. Peça',            variant: 'neutral' },
  concluida:             { label: 'Concluída',            variant: 'green' },
  cancelada:             { label: 'Cancelada',            variant: 'red' },
  entregue:              { label: 'Entregue',             variant: 'green' },
}

export default async function OsPage() {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const rows = await db
    .select({
      id: ordensServico.id,
      numero: ordensServico.numero,
      status: ordensServico.status,
      total: ordensServico.total,
      placaLida: ordensServico.placaLida,
      criadoEm: ordensServico.criadoEm,
      previsaoEntrega: ordensServico.previsaoEntrega,
      clienteNome: usuarios.nome,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
    })
    .from(ordensServico)
    .leftJoin(usuarios, eq(ordensServico.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(ordensServico.veiculoId, veiculos.id))
    .where(eq(ordensServico.lojaId, lojaId))
    .orderBy(desc(ordensServico.criadoEm))
    .limit(50)

  const abertas = rows.filter(r => !['concluida', 'cancelada', 'entregue'].includes(r.status ?? ''))
  const finalizadas = rows.filter(r => ['concluida', 'cancelada', 'entregue'].includes(r.status ?? ''))

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Ordens de Serviço</h1>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
            {abertas.length} em aberto · {finalizadas.length} finalizadas
          </p>
        </div>
        <Link href="/admin/os/nova" className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nova OS
        </Link>
      </div>

      {/* Em aberto */}
      {abertas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>
            Em andamento
          </p>
          <div className="space-y-2">
            {abertas.map(os => {
              const s = STATUS_OS[os.status ?? 'aberta']
              return (
                <Link key={os.id} href={`/admin/os/${os.id}`}
                  className="block p-4 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)', backdropFilter: 'blur(10px)' }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: '#55556A' }}>OS #{os.numero}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <p className="font-bold text-white mt-1">{os.clienteNome}</p>
                      <p className="text-sm" style={{ color: '#A0A0B8' }}>
                        {os.veiculoPlaca ?? os.placaLida ?? '—'} · {os.veiculoModelo ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black" style={{ color: '#C77DFF' }}>
                        {formatCurrency(parseFloat(os.total ?? '0'))}
                      </p>
                      {os.previsaoEntrega && (
                        <p className="text-xs mt-1" style={{ color: '#55556A' }}>
                          Entrega: {formatDateTime(os.previsaoEntrega)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#55556A' }}>
                    Aberta em {formatDateTime(os.criadoEm!)}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Finalizadas */}
      {finalizadas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>
            Finalizadas
          </p>
          <div className="space-y-2">
            {finalizadas.map(os => {
              const s = STATUS_OS[os.status ?? 'concluida']
              return (
                <Link key={os.id} href={`/admin/os/${os.id}`}
                  className="block p-3 rounded-2xl opacity-60"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: '#55556A' }}>OS #{os.numero}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">{os.clienteNome}</p>
                      <p className="text-xs" style={{ color: '#55556A' }}>{os.veiculoPlaca ?? os.placaLida ?? '—'}</p>
                    </div>
                    <p className="font-black text-sm" style={{ color: '#C77DFF' }}>
                      {formatCurrency(parseFloat(os.total ?? '0'))}
                    </p>
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
          <p className="font-semibold" style={{ color: '#A0A0B8' }}>Nenhuma OS ainda</p>
          <Link href="/admin/os/nova" className="btn-primary mt-4 mx-auto inline-flex text-xs px-4 py-2">
            Criar primeira OS
          </Link>
        </div>
      )}
    </div>
  )
}
