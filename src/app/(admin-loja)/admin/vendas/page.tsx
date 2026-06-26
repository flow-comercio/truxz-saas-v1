'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Trash2, Search, Loader2, CreditCard,
  Banknote, QrCode, Package, Wrench, CheckCircle2, Receipt, ScanLine
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { BarcodeScanner } from '@/components/admin/barcode-scanner'

const METODOS = [
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'cartao_credito', label: 'Crédito', icon: CreditCard },
  { value: 'cartao_debito', label: 'Débito', icon: CreditCard },
]

const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16 }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.35),transparent)' }

interface CartItem {
  id: string
  tipo: 'produto' | 'servico'
  produtoId?: string
  servicoId?: string
  descricao: string
  precoUnitario: number
  quantidade: number
  total: number
}

export default function PDVPage() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<CartItem[]>([])
  const [desconto, setDesconto] = useState(0)
  const [metodo, setMetodo] = useState<string>('')
  const [showHistorico, setShowHistorico] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const { data: catalogo = [] } = useQuery<any[]>({
    queryKey: ['catalogo-pdv', busca],
    queryFn: () => busca.length > 0 ? fetch(`/api/catalogo?q=${busca}`).then(r => r.json()) : Promise.resolve([]),
    enabled: busca.length > 0,
  })

  const { data: historico = [] } = useQuery<any[]>({
    queryKey: ['vendas-historico'],
    queryFn: () => fetch('/api/vendas').then(r => r.json()),
    enabled: showHistorico,
  })

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/vendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: (data) => {
      toast.success(`Venda #${data.numero} finalizada!`)
      setCarrinho([])
      setDesconto(0)
      setMetodo('')
      qc.invalidateQueries({ queryKey: ['vendas-historico'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const subtotal = carrinho.reduce((s, i) => s + i.total, 0)
  const total = subtotal - desconto

  async function handleBarcode(codigo: string) {
    setShowScanner(false)
    try {
      const res = await fetch(`/api/produtos?codigo=${codigo}`)
      const data = await res.json()
      if (!data || !data.id) { toast.error(`Código ${codigo} não encontrado no estoque`); return }
      const preco = parseFloat(data.precoVenda ?? 0)
      addItem({ ...data, _tipo: 'produto', preco })
      toast.success(`${data.nome} adicionado ao carrinho`)
    } catch {
      toast.error('Erro ao buscar produto')
    }
  }

  function addItem(item: any) {
    setBusca('')
    const existing = carrinho.findIndex(c => c.id === `${item._tipo}-${item.id}`)
    if (existing >= 0) {
      setCarrinho(p => p.map((c, i) => i === existing
        ? { ...c, quantidade: c.quantidade + 1, total: (c.quantidade + 1) * c.precoUnitario }
        : c))
    } else {
      const preco = parseFloat(item.preco ?? item.precoVenda ?? 0)
      setCarrinho(p => [...p, {
        id: `${item._tipo}-${item.id}`,
        tipo: item._tipo,
        produtoId: item._tipo === 'produto' ? item.id : undefined,
        servicoId: item._tipo === 'servico' ? item.id : undefined,
        descricao: item.nome,
        precoUnitario: preco,
        quantidade: 1,
        total: preco,
      }])
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return removeItem(id)
    setCarrinho(p => p.map(c => c.id === id ? { ...c, quantidade: qty, total: qty * c.precoUnitario } : c))
  }

  function removeItem(id: string) {
    setCarrinho(p => p.filter(c => c.id !== id))
  }

  function checkout() {
    if (!carrinho.length) return toast.error('Carrinho vazio')
    if (!metodo) return toast.error('Selecione o método de pagamento')
    mutation.mutate({
      itens: carrinho.map(c => ({
        tipo: c.tipo,
        produtoId: c.produtoId,
        servicoId: c.servicoId,
        descricao: c.descricao,
        quantidade: c.quantidade,
        precoUnitario: c.precoUnitario.toFixed(2),
        total: c.total.toFixed(2),
      })),
      metodo,
      desconto: desconto.toFixed(2),
    })
  }

  return (
    <div className="p-4 lg:p-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-white">PDV</h1>
          <p className="text-sm mt-0.5" style={{ color: '#55556A' }}>Ponto de Venda</p>
        </div>
        <button
          onClick={() => setShowHistorico(s => !s)}
          className="text-xs px-3 py-2 rounded-xl font-bold"
          style={{ background: 'rgba(157,78,221,0.1)', color: '#9D4EDD', border: '1px solid rgba(157,78,221,0.2)' }}>
          <Receipt className="w-4 h-4 inline mr-1" />
          Histórico
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Painel esquerdo: busca + carrinho */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative p-4" style={glass}>
            <div style={shimmer} />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55556A' }} />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar serviço ou produto..."
                  className="input pl-9 w-full"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0 font-bold text-xs transition-all"
                style={{ background: 'rgba(157,78,221,0.15)', color: '#9D4EDD', border: '1px solid rgba(157,78,221,0.3)' }}
                title="Ler código de barras">
                <ScanLine className="w-4 h-4" />
                Scan
              </button>
            </div>
            {catalogo.length > 0 && (
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {catalogo.map((item: any) => (
                  <button key={`${item._tipo}-${item.id}`} onClick={() => addItem(item)}
                    className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors">
                    {item._tipo === 'servico'
                      ? <Wrench className="w-4 h-4 flex-shrink-0" style={{ color: '#9D4EDD' }} />
                      : <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#9D4EDD' }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.nome}</p>
                    </div>
                    <span className="font-black text-sm flex-shrink-0" style={{ color: '#9D4EDD' }}>
                      {formatCurrency(parseFloat(item.preco ?? item.precoVenda ?? 0))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="relative p-4" style={glass}>
            <div style={shimmer} />
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4" style={{ color: '#9D4EDD' }} />
              <span className="font-bold text-white">Carrinho</span>
              {carrinho.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(157,78,221,0.2)', color: '#9D4EDD' }}>
                  {carrinho.length}
                </span>
              )}
            </div>

            {carrinho.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" style={{ color: '#2D2B3F' }} />
                <p className="text-sm" style={{ color: '#55556A' }}>Busque um serviço ou produto acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {carrinho.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.descricao}</p>
                      <p className="text-xs" style={{ color: '#55556A' }}>
                        {formatCurrency(item.precoUnitario)} / un
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, item.quantidade - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B8' }}>−</button>
                      <span className="w-8 text-center font-black text-white text-sm">{item.quantidade}</span>
                      <button onClick={() => updateQty(item.id, item.quantidade + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                        style={{ background: 'rgba(157,78,221,0.2)', color: '#9D4EDD' }}>+</button>
                    </div>
                    <span className="font-black text-sm w-20 text-right" style={{ color: '#9D4EDD' }}>
                      {formatCurrency(item.total)}
                    </span>
                    <button onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel direito: pagamento */}
        <div className="space-y-4">
          {/* Resumo */}
          <div className="relative p-4" style={glass}>
            <div style={shimmer} />
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>Resumo</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A0A0B8' }}>Subtotal</span>
                <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#A0A0B8' }}>Desconto</span>
                <input type="number" step="0.01" value={desconto}
                  onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                  className="input w-24 text-right" placeholder="0,00" />
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
                <span className="font-black text-white text-lg">Total</span>
                <span className="font-black text-2xl" style={{ color: '#9D4EDD' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="relative p-4" style={glass}>
            <div style={shimmer} />
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {METODOS.map(m => {
                const Icon = m.icon
                const active = metodo === m.value
                return (
                  <button key={m.value} onClick={() => setMetodo(m.value)}
                    className="flex items-center gap-2.5 p-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: active ? 'rgba(157,78,221,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(157,78,221,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      color: active ? '#9D4EDD' : '#A0A0B8',
                    }}>
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botão finalizar */}
          <button
            onClick={checkout}
            disabled={mutation.isPending || !carrinho.length || !metodo}
            className="w-full py-5 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: carrinho.length && metodo ? 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' : '#2D2B3F' }}>
            {mutation.isPending
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : <CheckCircle2 className="w-6 h-6" />}
            {mutation.isPending ? 'Finalizando...' : `Finalizar — ${formatCurrency(total)}`}
          </button>
        </div>
      </div>

      {/* Scanner de código de barras */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Histórico */}
      {showHistorico && (
        <div className="mt-6 relative p-4" style={glass}>
          <div style={shimmer} />
          <p className="font-bold text-white mb-3">Vendas Recentes</p>
          {historico.length === 0
            ? <p className="text-sm text-center py-4" style={{ color: '#55556A' }}>Nenhuma venda ainda</p>
            : (
              <div className="space-y-2">
                {historico.slice(0, 20).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(157,78,221,0.08)' }}>
                    <div>
                      <p className="text-sm font-bold text-white">Venda #{v.numero}</p>
                      <p className="text-xs" style={{ color: '#55556A' }}>
                        {v.metodo?.replace('_', ' ')} · {formatDateTime(v.finalizadoEm ?? v.criadoEm)}
                      </p>
                    </div>
                    <span className="font-black" style={{ color: '#9D4EDD' }}>{formatCurrency(parseFloat(v.total))}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
