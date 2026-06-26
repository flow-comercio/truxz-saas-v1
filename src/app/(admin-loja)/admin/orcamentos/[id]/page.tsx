'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, FileText, CheckCircle2, Loader2, ArrowRight, Wrench, Package, User, Car } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_ORC: Record<string, { label: string; variant: any }> = {
  rascunho:   { label: 'Rascunho',  variant: 'neutral' },
  enviado:    { label: 'Enviado',   variant: 'amber' },
  aprovado:   { label: 'Aprovado',  variant: 'green' },
  recusado:   { label: 'Recusado', variant: 'red' },
  expirado:   { label: 'Expirado', variant: 'red' },
  convertido: { label: 'Convertido em OS', variant: 'purple' },
}

const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16 }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.35),transparent)' }

export default function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: orc, isLoading } = useQuery<any>({
    queryKey: ['orcamento', id],
    queryFn: () => fetch(`/api/orcamentos/${id}`).then(r => r.json()),
  })

  const patchMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/orcamentos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: () => { toast.success('Orçamento atualizado'); qc.invalidateQueries({ queryKey: ['orcamento', id] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  const convertMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/orcamentos/${id}`, { method: 'POST' })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || j.message); return j }),
    onSuccess: (data) => {
      toast.success(data.message)
      qc.invalidateQueries({ queryKey: ['orcamento', id] })
      router.push(`/admin/os/${data.os.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
    </div>
  )
  if (!orc || orc.error) return <div className="p-6 text-center" style={{ color: '#A0A0B8' }}>Orçamento não encontrado</div>

  const cfg = STATUS_ORC[orc.status] ?? STATUS_ORC.rascunho

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orcamentos" className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-white">Orçamento #{orc.numero}</h1>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          {orc.validoAte && (
            <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
              Válido até {formatDate(orc.validoAte)}
            </p>
          )}
        </div>
      </div>

      {/* BOTÃO PRINCIPAL: Converter em OS */}
      {orc.status !== 'convertido' && orc.status !== 'cancelada' && (
        <div className="relative p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg,rgba(157,78,221,0.15),rgba(123,47,190,0.1))', border: '1px solid rgba(157,78,221,0.3)' }}>
          <p className="text-sm font-bold text-white mb-1">
            {orc.status === 'aprovado' ? 'Orçamento aprovado!' : 'Converter em Ordem de Serviço'}
          </p>
          <p className="text-xs mb-3" style={{ color: '#A0A0B8' }}>
            Gera automaticamente uma OS com todos os itens deste orçamento.
            {!orc.clienteId && ' ⚠ Adicione um cliente antes de converter.'}
          </p>
          <button
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending || !orc.clienteId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
            {convertMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ArrowRight className="w-4 h-4" />}
            Gerar Ordem de Serviço
          </button>
        </div>
      )}

      {/* Cliente + Veículo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Cliente</span>
          </div>
          <p className="font-bold text-white text-sm">{orc.cliente?.nome || '—'}</p>
          <p className="text-xs" style={{ color: '#A0A0B8' }}>{orc.cliente?.telefone || ''}</p>
        </div>
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Veículo</span>
          </div>
          <p className="font-bold text-white text-sm">
            {orc.veiculo ? `${orc.veiculo.marca ?? ''} ${orc.veiculo.modelo ?? ''}`.trim() || orc.veiculo.placa : '—'}
          </p>
          <p className="text-xs" style={{ color: '#A0A0B8' }}>{orc.veiculo?.placa || ''}</p>
        </div>
      </div>

      {/* Itens */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4" style={{ color: '#9D4EDD' }} />
          <span className="font-bold text-white">Itens do Orçamento</span>
        </div>
        {orc.itens?.length > 0 ? (
          <div className="space-y-2">
            {orc.itens.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
                <div>
                  <div className="flex items-center gap-1.5">
                    {item.tipo === 'produto'
                      ? <Package className="w-3.5 h-3.5" style={{ color: '#9D4EDD' }} />
                      : <Wrench className="w-3.5 h-3.5" style={{ color: '#9D4EDD' }} />}
                    <p className="text-sm font-semibold text-white">
                      {item.servicoNome || item.produtoNome || item.descricao}
                    </p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
                    {parseFloat(item.quantidade)}x R$ {parseFloat(item.precoUnitario).toFixed(2)}
                    {parseFloat(item.desconto) > 0 && ` − R$ ${parseFloat(item.desconto).toFixed(2)} desc.`}
                  </p>
                </div>
                <span className="font-black text-white">{formatCurrency(parseFloat(item.total))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: '#55556A' }}>Nenhum item</p>
        )}

        <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#A0A0B8' }}>Subtotal</span>
            <span className="text-white">{formatCurrency(parseFloat(orc.subtotal ?? 0))}</span>
          </div>
          {parseFloat(orc.desconto ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: '#A0A0B8' }}>Desconto</span>
              <span style={{ color: '#EF4444' }}>− {formatCurrency(parseFloat(orc.desconto))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="font-black text-xl" style={{ color: '#9D4EDD' }}>
              {formatCurrency(parseFloat(orc.total ?? 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {orc.observacoes && (
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Observações</p>
          <p className="text-sm" style={{ color: '#A0A0B8' }}>{orc.observacoes}</p>
        </div>
      )}

      {/* Ações de status */}
      {orc.status !== 'convertido' && (
        <div className="grid grid-cols-2 gap-3">
          {orc.status !== 'aprovado' && (
            <button
              onClick={() => patchMutation.mutate({ status: 'aprovado' })}
              disabled={patchMutation.isPending}
              className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 className="w-4 h-4" />
              Aprovar
            </button>
          )}
          {orc.status !== 'enviado' && orc.status !== 'aprovado' && (
            <button
              onClick={() => patchMutation.mutate({ status: 'enviado' })}
              disabled={patchMutation.isPending}
              className="py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
              Marcar Enviado
            </button>
          )}
          <button
            onClick={() => patchMutation.mutate({ status: 'recusado' })}
            disabled={patchMutation.isPending}
            className="py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Recusado
          </button>
        </div>
      )}
    </div>
  )
}
