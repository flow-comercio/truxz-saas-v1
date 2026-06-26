'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, DollarSign, Clock, CheckCircle2, XCircle, ChevronDown, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type StatusComissao = 'pendente' | 'aprovada' | 'paga' | 'cancelada'

interface Comissao {
  id: string
  operadorId: string
  operadorNome: string | null
  referenciaId: string
  referenciaTipo: string
  valor: string
  status: StatusComissao
  pagoEm: string | null
  criadoEm: string
}

interface Data {
  rows: Comissao[]
  totalPendente: number
  totalPago: number
}

const STATUS_LABEL: Record<StatusComissao, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

const STATUS_COLOR: Record<StatusComissao, { text: string; bg: string; border: string }> = {
  pendente: { text: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  aprovada: { text: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  paga:     { text: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
  cancelada:{ text: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
}

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(157,78,221,0.15)',
  borderRadius: 16,
  padding: '1.25rem',
  position: 'relative' as const,
  overflow: 'hidden' as const,
}
const shimmer = {
  position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1,
  background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.4), transparent)',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ComissoesPage() {
  const qc = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const params = new URLSearchParams()
  if (filtroStatus) params.set('status', filtroStatus)
  if (de) params.set('de', de)
  if (ate) params.set('ate', ate)

  const { data, isLoading } = useQuery<Data>({
    queryKey: ['comissoes', filtroStatus, de, ate],
    queryFn: () => fetch(`/api/comissoes?${params}`).then(r => r.json()),
  })

  const { mutate: pagar, isPending: pagando } = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/comissoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'paga' }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comissoes'] })
      setSelecionados(new Set())
    },
  })

  const { mutate: cancelar, isPending: cancelando } = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/comissoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'cancelada' }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comissoes'] })
      setSelecionados(new Set())
    },
  })

  const rows = data?.rows ?? []
  const pendentes = rows.filter(r => r.status === 'pendente')

  function toggleAll() {
    const pendentesIds = pendentes.map(r => r.id)
    if (pendentesIds.every(id => selecionados.has(id))) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(pendentesIds))
    }
  }

  function toggle(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selArray = [...selecionados]

  return (
    <div className="p-4 lg:p-6 space-y-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <h1 className="text-xl font-black text-white">Comissões</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div style={card}>
          <div style={shimmer} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Clock className="w-4 h-4" style={{ color: '#FBBF24' }} />
          </div>
          <p className="text-xl font-black text-white">{formatCurrency(data?.totalPendente ?? 0)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>A pagar</p>
        </div>
        <div style={card}>
          <div style={shimmer} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#34D399' }} />
          </div>
          <p className="text-xl font-black text-white">{formatCurrency(data?.totalPago ?? 0)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>Já pago</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ ...card, padding: '1rem' }}>
        <div style={shimmer} />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Status</label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm font-semibold outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(157,78,221,0.2)', color: '#A0A0B8', minWidth: 140 }}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovada">Aprovada</option>
              <option value="paga">Paga</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>De</label>
            <input type="date" value={de} onChange={e => setDe(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(157,78,221,0.2)', color: '#A0A0B8' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Até</label>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(157,78,221,0.2)', color: '#A0A0B8' }} />
          </div>
          {(filtroStatus || de || ate) && (
            <button onClick={() => { setFiltroStatus(''); setDe(''); setAte('') }}
              className="px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Ações em lote */}
      {selecionados.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap px-1">
          <span className="text-sm font-bold" style={{ color: '#A0A0B8' }}>
            {selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => pagar(selArray)}
            disabled={pagando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399' }}>
            {pagando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Marcar como Pago
          </button>
          <button
            onClick={() => cancelar(selArray)}
            disabled={cancelando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
            {cancelando ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Cancelar
          </button>
        </div>
      )}

      {/* Tabela */}
      <div style={card}>
        <div style={shimmer} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: '#2A2A3A' }} />
            <p className="text-sm font-bold" style={{ color: '#55556A' }}>Nenhuma comissão encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="pb-3 pr-3 text-left">
                    <input type="checkbox"
                      checked={pendentes.length > 0 && pendentes.every(r => selecionados.has(r.id))}
                      onChange={toggleAll}
                      className="accent-purple-500" />
                  </th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-black uppercase tracking-wider" style={{ color: '#55556A' }}>Operador</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-black uppercase tracking-wider" style={{ color: '#55556A' }}>Tipo</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-black uppercase tracking-wider" style={{ color: '#55556A' }}>Valor</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-black uppercase tracking-wider" style={{ color: '#55556A' }}>Status</th>
                  <th className="pb-3 text-left text-[11px] font-black uppercase tracking-wider" style={{ color: '#55556A' }}>Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {rows.map(row => {
                  const c = STATUS_COLOR[row.status]
                  const isPendente = row.status === 'pendente'
                  return (
                    <tr key={row.id} className="transition-colors"
                      style={{ background: selecionados.has(row.id) ? 'rgba(157,78,221,0.07)' : 'transparent' }}>
                      <td className="py-3 pr-3">
                        {isPendente && (
                          <input type="checkbox"
                            checked={selecionados.has(row.id)}
                            onChange={() => toggle(row.id)}
                            className="accent-purple-500" />
                        )}
                      </td>
                      <td className="py-3 pr-4 font-bold text-white whitespace-nowrap">
                        {row.operadorNome ?? '—'}
                      </td>
                      <td className="py-3 pr-4 capitalize" style={{ color: '#A0A0B8' }}>
                        {row.referenciaTipo}
                      </td>
                      <td className="py-3 pr-4 font-black" style={{ color: '#34D399' }}>
                        {formatCurrency(parseFloat(row.valor))}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black"
                          style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}>
                          {STATUS_LABEL[row.status]}
                        </span>
                      </td>
                      <td className="py-3 text-xs" style={{ color: '#55556A' }}>
                        {row.status === 'paga' && row.pagoEm ? fmt(row.pagoEm) : fmt(row.criadoEm)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
