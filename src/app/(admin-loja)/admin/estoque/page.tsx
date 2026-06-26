'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Package, Plus, ScanLine, AlertTriangle, Search,
  Loader2, TrendingDown, TrendingUp, ArrowLeftRight, X, Check, Pencil, Percent, DollarSign
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BarcodeScanner } from '@/components/admin/barcode-scanner'

interface Produto {
  id: string; nome: string; codigoBarras: string | null; sku: string | null
  precoVenda: string; precoCompra: string | null; unidade: string | null
  categoriaNome: string | null; quantidadeEstoque: string | null; quantidadeMinima: string | null
  comissaoTipo: string | null; comissaoValor: string | null
}

interface Form {
  nome: string; codigoBarras: string; precoVenda: string; precoCompra: string
  unidade: string; estoqueInicial: string; estoqueMinimo: string
  comissaoTipo: '' | 'percentual' | 'fixo'; comissaoValor: string
}

const EMPTY: Form = {
  nome: '', codigoBarras: '', precoVenda: '', precoCompra: '',
  unidade: 'un', estoqueInicial: '0', estoqueMinimo: '0',
  comissaoTipo: '', comissaoValor: '',
}
const UNIDADES = ['un', 'ml', 'L', 'kg', 'g', 'cx', 'par', 'rolo']

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

export default function EstoquePage() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEntrada, setShowEntrada] = useState<Produto | null>(null)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [editForm, setEditForm] = useState<Partial<Form>>({})
  const [qtdEntrada, setQtdEntrada] = useState('')
  const [obsEntrada, setObsEntrada] = useState('')

  const { data: produtos = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos', busca],
    queryFn: () => fetch(busca ? `/api/produtos?q=${busca}` : '/api/produtos').then(r => r.json()),
  })

  const criarProduto = useMutation({
    mutationFn: (data: Form) =>
      fetch('/api/produtos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Produto cadastrado!')
      qc.invalidateQueries({ queryKey: ['produtos'] })
      setShowModal(false); setForm(EMPTY)
    },
    onError: () => toast.error('Erro ao cadastrar produto'),
  })

  const editarProduto = useMutation({
    mutationFn: (data: Partial<Form> & { id: string }) =>
      fetch('/api/produtos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Produto atualizado!')
      qc.invalidateQueries({ queryKey: ['produtos'] })
      setEditando(null); setEditForm({})
    },
    onError: () => toast.error('Erro ao atualizar produto'),
  })

  const registrarEntrada = useMutation({
    mutationFn: ({ produtoId, quantidade, obs }: { produtoId: string; quantidade: string; obs: string }) =>
      fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, quantidade, observacoes: obs }),
      }),
    onSuccess: () => {
      toast.success('Entrada registrada!')
      qc.invalidateQueries({ queryKey: ['produtos'] })
      setShowEntrada(null); setQtdEntrada(''); setObsEntrada('')
    },
    onError: () => toast.error('Erro ao registrar entrada'),
  })

  function handleBarcode(codigo: string) {
    setShowScanner(false)
    setBusca(codigo)
    const existe = produtos.find(p => p.codigoBarras === codigo)
    if (existe) {
      setShowEntrada(existe)
    } else {
      setForm(f => ({ ...f, codigoBarras: codigo }))
      setShowModal(true)
      toast.info(`Código ${codigo} não encontrado. Cadastre o produto.`)
    }
  }

  function abrirEdicao(p: Produto) {
    setEditando(p)
    setEditForm({
      nome: p.nome,
      precoVenda: p.precoVenda,
      precoCompra: p.precoCompra ?? '',
      codigoBarras: p.codigoBarras ?? '',
      unidade: p.unidade ?? 'un',
      comissaoTipo: (p.comissaoTipo as '' | 'percentual' | 'fixo') ?? '',
      comissaoValor: p.comissaoValor ?? '',
    })
  }

  const criticos = produtos.filter(p =>
    parseFloat(p.quantidadeEstoque ?? '0') <= parseFloat(p.quantidadeMinima ?? '0') &&
    parseFloat(p.quantidadeMinima ?? '0') > 0
  )

  function ComissaoFields({ value, onChange }: {
    value: { comissaoTipo: string; comissaoValor: string }
    onChange: (t: string, v: string) => void
  }) {
    return (
      <div>
        <label className="label flex items-center gap-1.5">
          <Percent className="w-3 h-3" style={{ color: '#9D4EDD' }} />
          Comissão do operador
        </label>
        <div className="flex gap-2">
          <select
            className="input"
            style={{ minWidth: 130 }}
            value={value.comissaoTipo}
            onChange={e => onChange(e.target.value, value.comissaoValor)}>
            <option value="">Sem comissão</option>
            <option value="percentual">% do valor</option>
            <option value="fixo">Valor fixo / un</option>
          </select>
          {value.comissaoTipo && (
            <input
              type="number" step="0.01" min="0"
              className="input flex-1"
              placeholder={value.comissaoTipo === 'percentual' ? 'Ex: 10' : 'Ex: 5,00'}
              value={value.comissaoValor}
              onChange={e => onChange(value.comissaoTipo, e.target.value)} />
          )}
        </div>
        {value.comissaoTipo && value.comissaoValor && (
          <p className="text-xs mt-1.5" style={{ color: '#9D4EDD' }}>
            {value.comissaoTipo === 'percentual'
              ? `${value.comissaoValor}% do total do item`
              : `R$ ${parseFloat(value.comissaoValor || '0').toFixed(2)} por unidade vendida`}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {showScanner && <BarcodeScanner onDetected={handleBarcode} onClose={() => setShowScanner(false)} />}

      {/* Modal novo produto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            style={{ background: '#12101E', border: '1px solid rgba(157,78,221,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white">Novo Produto</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" style={{ color: '#55556A' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Código de barras</label>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="EAN-13 ou Code128" value={form.codigoBarras}
                    onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))} />
                  <button onClick={() => { setShowModal(false); setShowScanner(true) }}
                    className="p-3 rounded-xl" style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
                    <ScanLine className="w-5 h-5" style={{ color: '#9D4EDD' }} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Nome do produto *</label>
                <input className="input" placeholder="Ex: Cera líquida premium" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Preço de venda *</label>
                  <input type="number" step="0.01" className="input" placeholder="0,00" value={form.precoVenda}
                    onChange={e => setForm(f => ({ ...f, precoVenda: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Preço de custo</label>
                  <input type="number" step="0.01" className="input" placeholder="0,00" value={form.precoCompra}
                    onChange={e => setForm(f => ({ ...f, precoCompra: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Unidade</label>
                  <select className="input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estoque inicial</label>
                  <input type="number" className="input" placeholder="0" value={form.estoqueInicial}
                    onChange={e => setForm(f => ({ ...f, estoqueInicial: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Estoque mínimo</label>
                  <input type="number" className="input" placeholder="0" value={form.estoqueMinimo}
                    onChange={e => setForm(f => ({ ...f, estoqueMinimo: e.target.value }))} />
                </div>
              </div>
              <ComissaoFields
                value={{ comissaoTipo: form.comissaoTipo, comissaoValor: form.comissaoValor }}
                onChange={(t, v) => setForm(f => ({ ...f, comissaoTipo: t as any, comissaoValor: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => criarProduto.mutate(form)}
                disabled={!form.nome || !form.precoVenda || criarProduto.isPending}
                className="btn-primary flex-1">
                {criarProduto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar produto */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            style={{ background: '#12101E', border: '1px solid rgba(157,78,221,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white">Editar Produto</h2>
              <button onClick={() => setEditando(null)}><X className="w-5 h-5" style={{ color: '#55556A' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nome do produto *</label>
                <input className="input" value={editForm.nome ?? ''} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Preço de venda *</label>
                  <input type="number" step="0.01" className="input" value={editForm.precoVenda ?? ''} onChange={e => setEditForm(f => ({ ...f, precoVenda: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Preço de custo</label>
                  <input type="number" step="0.01" className="input" value={editForm.precoCompra ?? ''} onChange={e => setEditForm(f => ({ ...f, precoCompra: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Código de barras</label>
                  <input className="input" value={editForm.codigoBarras ?? ''} onChange={e => setEditForm(f => ({ ...f, codigoBarras: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Unidade</label>
                  <select className="input" value={editForm.unidade ?? 'un'} onChange={e => setEditForm(f => ({ ...f, unidade: e.target.value }))}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <ComissaoFields
                value={{ comissaoTipo: editForm.comissaoTipo ?? '', comissaoValor: editForm.comissaoValor ?? '' }}
                onChange={(t, v) => setEditForm(f => ({ ...f, comissaoTipo: t as any, comissaoValor: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditando(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => editarProduto.mutate({ id: editando.id, ...editForm })}
                disabled={!editForm.nome || !editForm.precoVenda || editarProduto.isPending}
                className="btn-primary flex-1">
                {editarProduto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal entrada de estoque */}
      {showEntrada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-5" style={{ background: '#12101E', border: '1px solid rgba(74,222,128,0.25)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-white">Entrada de Estoque</h2>
              <button onClick={() => setShowEntrada(null)}><X className="w-5 h-5" style={{ color: '#55556A' }} /></button>
            </div>
            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <p className="font-bold text-white">{showEntrada.nome}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4ADE80' }}>
                Estoque atual: {showEntrada.quantidadeEstoque ?? '0'} {showEntrada.unidade}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Quantidade a entrada *</label>
                <input type="number" step="0.001" className="input text-xl font-bold text-center" placeholder="0"
                  value={qtdEntrada} onChange={e => setQtdEntrada(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Observações</label>
                <input className="input" placeholder="Ex: Compra NF 001234" value={obsEntrada}
                  onChange={e => setObsEntrada(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEntrada(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => registrarEntrada.mutate({ produtoId: showEntrada.id, quantidade: qtdEntrada, obs: obsEntrada })}
                disabled={!qtdEntrada || parseFloat(qtdEntrada) <= 0 || registrarEntrada.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4ADE80, #16a34a)' }}>
                {registrarEntrada.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Registrar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Estoque</h1>
            <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>{produtos.length} produtos cadastrados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowScanner(true)}
              className="p-2.5 rounded-xl" style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
              <ScanLine className="w-5 h-5" style={{ color: '#9D4EDD' }} />
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Produto
            </button>
          </div>
        </div>

        {/* Alertas críticos */}
        {criticos.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: '#FBBF24' }} />
              <p className="font-bold text-sm" style={{ color: '#FBBF24' }}>
                {criticos.length} produto{criticos.length > 1 ? 's' : ''} com estoque crítico
              </p>
            </div>
            <div className="space-y-2">
              {criticos.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: '#A0A0B8' }}>{p.nome}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>
                      {p.quantidadeEstoque ?? '0'}/{p.quantidadeMinima} {p.unidade}
                    </span>
                    <button onClick={() => setShowEntrada(p)}
                      className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>
                      + Entrada
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#55556A' }} />
          <input className="input pl-9" placeholder="Buscar produto ou código de barras..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
          </div>
        ) : (
          <div className="space-y-2">
            {produtos.map(p => {
              const qtd = parseFloat(p.quantidadeEstoque ?? '0')
              const min = parseFloat(p.quantidadeMinima ?? '0')
              const critico = qtd <= min && min > 0
              const temComissao = p.comissaoTipo && p.comissaoValor
              return (
                <div key={p.id} className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${critico ? 'rgba(251,191,36,0.3)' : 'rgba(157,78,221,0.15)'}`,
                  }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{p.nome}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-0.5">
                        {p.codigoBarras && (
                          <span className="text-xs font-mono" style={{ color: '#55556A' }}>{p.codigoBarras}</span>
                        )}
                        {p.categoriaNome && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(157,78,221,0.1)', color: '#C77DFF' }}>
                            {p.categoriaNome}
                          </span>
                        )}
                        {temComissao && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
                            <Percent className="w-2.5 h-2.5" />
                            {p.comissaoTipo === 'percentual'
                              ? `${p.comissaoValor}% comissão`
                              : `R$${parseFloat(p.comissaoValor!).toFixed(2)}/un`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black" style={{ color: '#C77DFF' }}>
                        {formatCurrency(parseFloat(p.precoVenda))}
                      </p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {critico ? (
                          <AlertTriangle className="w-3 h-3" style={{ color: '#FBBF24' }} />
                        ) : (
                          <Package className="w-3 h-3" style={{ color: '#4ADE80' }} />
                        )}
                        <span className="text-xs font-bold" style={{ color: critico ? '#FBBF24' : '#4ADE80' }}>
                          {qtd} {p.unidade}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowEntrada(p)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
                      <TrendingUp className="w-3.5 h-3.5" /> Entrada
                    </button>
                    <button onClick={() => abrirEdicao(p)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      style={{ background: 'rgba(157,78,221,0.1)', color: '#9D4EDD', border: '1px solid rgba(157,78,221,0.2)' }}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
