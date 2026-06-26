'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Search, Loader2, Wrench, Package } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16 }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.35),transparent)' }

interface Item {
  tipo: 'servico' | 'produto'
  servicoId?: string
  produtoId?: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  total: number
}

export default function OrcamentoNovoPage() {
  const router = useRouter()
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSel, setClienteSel] = useState<any>(null)
  const [veiculoSel, setVeiculoSel] = useState<any>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [busca, setBusca] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [validoAte, setValidoAte] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const { data: clientes = [] } = useQuery<any[]>({
    queryKey: ['clientes-busca', clienteBusca],
    queryFn: () => clienteBusca.length > 1 ? fetch(`/api/clientes?q=${clienteBusca}`).then(r => r.json()) : Promise.resolve([]),
    enabled: clienteBusca.length > 1,
  })

  const { data: veiculos = [] } = useQuery<any[]>({
    queryKey: ['veiculos', clienteSel?.id],
    queryFn: () => fetch(`/api/veiculos?clienteId=${clienteSel.id}`).then(r => r.json()),
    enabled: !!clienteSel?.id,
  })

  const { data: catalogo = [] } = useQuery<any[]>({
    queryKey: ['catalogo', busca],
    queryFn: () => fetch(`/api/catalogo?q=${busca}`).then(r => r.json()),
    enabled: busca.length > 0,
  })

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/orcamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: (data) => { toast.success(`Orçamento #${data.numero} criado`); router.push(`/admin/orcamentos/${data.id}`) },
    onError: (e: Error) => toast.error(e.message),
  })

  const subtotal = itens.reduce((s, i) => s + i.total, 0)
  const total = subtotal - desconto

  function addItem(item: any) {
    const preco = parseFloat(item.preco ?? item.precoVenda ?? 0)
    setItens(prev => [...prev, {
      tipo: item._tipo,
      servicoId: item._tipo === 'servico' ? item.id : undefined,
      produtoId: item._tipo === 'produto' ? item.id : undefined,
      descricao: item.nome,
      quantidade: 1,
      precoUnitario: preco,
      desconto: 0,
      total: preco,
    }])
    setBusca('')
  }

  function updateItem(i: number, field: keyof Item, value: any) {
    setItens(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      updated.total = (updated.quantidade * updated.precoUnitario) - updated.desconto
      return updated
    }))
  }

  function submit() {
    if (!itens.length) return toast.error('Adicione ao menos um item')
    mutation.mutate({
      clienteId: clienteSel?.id,
      veiculoId: veiculoSel?.id,
      itens: itens.map((item, i) => ({ ...item, ordem: i })),
      subtotal: subtotal.toFixed(2),
      desconto: desconto.toFixed(2),
      total: total.toFixed(2),
      validoAte: validoAte || null,
      observacoes,
    })
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div className="flex items-center gap-3">
        <Link href="/admin/orcamentos" className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-xl font-black text-white">Novo Orçamento</h1>
      </div>

      {/* Cliente */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Cliente</label>
        {clienteSel ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{clienteSel.nome}</p>
              <p className="text-xs" style={{ color: '#A0A0B8' }}>{clienteSel.telefone}</p>
            </div>
            <button onClick={() => { setClienteSel(null); setVeiculoSel(null) }}
              className="text-xs px-3 py-1 rounded-lg" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}>
              Trocar
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55556A' }} />
            <input
              value={clienteBusca}
              onChange={e => setClienteBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="input pl-9 w-full"
            />
            {clientes.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden"
                style={{ background: '#1A1530', border: '1px solid rgba(157,78,221,0.3)' }}>
                {clientes.map((c: any) => (
                  <button key={c.id} onClick={() => { setClienteSel(c); setClienteBusca('') }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors">
                    <p className="text-sm font-bold text-white">{c.nome}</p>
                    <p className="text-xs" style={{ color: '#A0A0B8' }}>{c.telefone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Veículo */}
      {clienteSel && veiculos.length > 0 && (
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Veículo</label>
          <select
            value={veiculoSel?.id ?? ''}
            onChange={e => setVeiculoSel(veiculos.find((v: any) => v.id === e.target.value) ?? null)}
            className="input w-full">
            <option value="">Sem veículo específico</option>
            {veiculos.map((v: any) => (
              <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>
            ))}
          </select>
        </div>
      )}

      {/* Busca de Itens */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Adicionar Serviço ou Produto</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55556A' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar serviço ou produto..."
            className="input pl-9 w-full"
          />
          {catalogo.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden"
              style={{ background: '#1A1530', border: '1px solid rgba(157,78,221,0.3)' }}>
              {catalogo.map((item: any) => (
                <button key={`${item._tipo}-${item.id}`} onClick={() => addItem(item)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                  {item._tipo === 'servico'
                    ? <Wrench className="w-4 h-4 flex-shrink-0" style={{ color: '#9D4EDD' }} />
                    : <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#9D4EDD' }} />}
                  <div>
                    <p className="text-sm font-bold text-white">{item.nome}</p>
                    <p className="text-xs" style={{ color: '#A0A0B8' }}>
                      {formatCurrency(parseFloat(item.preco ?? item.precoVenda ?? 0))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de itens */}
      {itens.length > 0 && (
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>Itens do Orçamento</p>
          <div className="space-y-3">
            {itens.map((item, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{item.descricao}</span>
                  <button onClick={() => setItens(p => p.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs" style={{ color: '#55556A' }}>Qtd</label>
                    <input type="number" step="0.01" value={item.quantidade}
                      onChange={e => updateItem(i, 'quantidade', parseFloat(e.target.value) || 1)}
                      className="input w-full mt-0.5 text-center" />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#55556A' }}>Preço</label>
                    <input type="number" step="0.01" value={item.precoUnitario}
                      onChange={e => updateItem(i, 'precoUnitario', parseFloat(e.target.value) || 0)}
                      className="input w-full mt-0.5" />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#55556A' }}>Total</label>
                    <p className="mt-2 font-black text-right" style={{ color: '#9D4EDD' }}>{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#A0A0B8' }}>Subtotal</span>
              <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#A0A0B8' }}>Desconto</span>
              <input type="number" step="0.01" value={desconto}
                onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                className="input w-28 text-right" placeholder="0,00" />
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="font-black text-xl" style={{ color: '#9D4EDD' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Validade + Observações */}
      <div className="relative p-4 space-y-4" style={glass}>
        <div style={shimmer} />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>
            Válido até (opcional)
          </label>
          <input type="date" value={validoAte} onChange={e => setValidoAte(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>
            Observações
          </label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            rows={3} className="input w-full resize-none" placeholder="Condições, prazo de execução..." />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={mutation.isPending || itens.length === 0}
        className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
        {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        Criar Orçamento
      </button>
    </div>
  )
}
