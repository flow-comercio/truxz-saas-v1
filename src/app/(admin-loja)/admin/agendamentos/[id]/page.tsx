import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos, pagamentos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { formatCurrency, formatDateTime, minutesToHours } from '@/lib/utils'
import { AgendamentoAcoes } from '@/components/admin/agendamento-acoes'
import { FotosAgendamento } from '@/components/admin/fotos-agendamento'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' }> = {
  pendente:     { label: 'Pendente',     variant: 'amber' },
  confirmado:   { label: 'Confirmado',   variant: 'purple' },
  em_andamento: { label: 'Em Andamento', variant: 'purple' },
  concluido:    { label: 'Concluído',    variant: 'green' },
  cancelado:    { label: 'Cancelado',    variant: 'red' },
  no_show:      { label: 'No-show',      variant: 'neutral' },
}

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.35), transparent)' }

export default async function AgendamentoDetalhe({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const [ag] = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal,
      observacoes: agendamentos.observacoes,
      observacoesInternas: agendamentos.observacoesInternas,
      avaliacao: agendamentos.avaliacao,
      comentarioAvaliacao: agendamentos.comentarioAvaliacao,
      clienteId: agendamentos.clienteId,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      clienteEmail: usuarios.email,
      servicoNome: servicos.nome,
      servicoDuracao: servicos.duracaoMinutos,
      servicoPreco: servicos.preco,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
      veiculoCor: veiculos.cor,
      veiculoMarca: veiculos.marca,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.lojaId, lojaId)))
    .limit(1)

  if (!ag) notFound()

  const [pag] = await db
    .select()
    .from(pagamentos)
    .where(eq(pagamentos.agendamentoId, ag.id))
    .limit(1)

  const status = STATUS_LABELS[ag.status ?? 'pendente']

  return (
    <div className="p-4 lg:p-6 max-w-xl space-y-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/agendamentos"
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(157,78,221,0.15)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#A0A0B8' }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Agendamento</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs" style={{ color: '#55556A' }}>
              {ag.dataHoraInicio ? formatDateTime(ag.dataHoraInicio) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div style={card}>
        <div style={shimmer} />
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#55556A' }}>Cliente</p>
        <p className="font-black text-white">{ag.clienteNome}</p>
        <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>{ag.clienteEmail}</p>
        {ag.clienteTelefone && (
          <a href={`tel:${ag.clienteTelefone}`} className="text-sm font-bold mt-1 block" style={{ color: '#9D4EDD' }}>
            {ag.clienteTelefone}
          </a>
        )}
      </div>

      {/* Serviço */}
      <div style={card}>
        <div style={shimmer} />
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#55556A' }}>Serviço</p>
        <p className="font-black text-white">{ag.servicoNome}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm" style={{ color: '#A0A0B8' }}>{minutesToHours(ag.servicoDuracao)}</span>
          <span className="font-black" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(ag.precoTotal))}</span>
        </div>
      </div>

      {/* Veículo */}
      {ag.veiculoPlaca && (
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#55556A' }}>Veículo</p>
          <p className="font-black text-white">{ag.veiculoPlaca}</p>
          <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>
            {[ag.veiculoMarca, ag.veiculoModelo, ag.veiculoCor].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Observações do cliente */}
      {ag.observacoes && (
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Obs. do Cliente</p>
          <p className="text-sm" style={{ color: '#A0A0B8' }}>{ag.observacoes}</p>
        </div>
      )}

      {/* Observações internas */}
      {ag.observacoesInternas && (
        <div style={{ ...card, borderColor: 'rgba(251,191,36,0.25)' }}>
          <div style={{ ...shimmer, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)' }} />
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#92400E' }}>Obs. Internas</p>
          <p className="text-sm" style={{ color: '#FCD34D' }}>{ag.observacoesInternas}</p>
        </div>
      )}

      {/* Avaliação */}
      {ag.avaliacao && (
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>Avaliação</p>
          <p className="text-xl" style={{ color: '#FBBF24' }}>
            {'★'.repeat(ag.avaliacao)}{'☆'.repeat(5 - ag.avaliacao)}
          </p>
          {ag.comentarioAvaliacao && (
            <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>{ag.comentarioAvaliacao}</p>
          )}
        </div>
      )}

      {/* Pagamento */}
      {pag && (
        <div style={card}>
          <div style={shimmer} />
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#55556A' }}>Pagamento</p>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#A0A0B8' }}>{pag.metodo ?? 'Pix'}</span>
            <Badge variant={pag.status === 'pago' ? 'green' : 'amber'}>{pag.status}</Badge>
          </div>
          <p className="font-black text-white mt-2">{formatCurrency(parseFloat(pag.valor))}</p>
        </div>
      )}

      {/* Fotos antes/depois */}
      <FotosAgendamento
        agendamentoId={ag.id}
        fotoAntes={(ag as any).fotoAntes ?? []}
        fotoDepois={(ag as any).fotoDepois ?? []}
        editavel={['em_andamento', 'concluido'].includes(ag.status ?? '')}
      />

      {/* Ações */}
      <AgendamentoAcoes id={ag.id} statusAtual={ag.status ?? 'pendente'} />
    </div>
  )
}
