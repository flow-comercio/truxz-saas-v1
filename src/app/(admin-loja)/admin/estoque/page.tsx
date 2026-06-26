'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Package, Plus, ScanLine, AlertTriangle, Search, Loader2, TrendingUp, Pencil, Percent, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BarcodeScanner } from '@/components/admin/barcode-scanner'
import { BottomSheet } from '@/components/ui/bottom-sheet'

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
const EMPTY: Form = { nome: '', codigoBarras: '', precoVenda: '', precoCompra: '', unidade: 'un', estoqueInicial: '0', estoqueMinimo: '0', comissaoTipo: '', comissaoValor: '' }
const UNIDADES = ['un', 'ml', 'L', 'kg', 'g', 'cx', 'par', 'rolo']

function ComissaoFields({ value, onChange }: { value: { comissaoTipo: string; comissaoValor: string }; onChange: (t: string, v: string) => void }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5"><Percent className="w-3 h-3 text-[#9D4EDD]" /> Comissão do operador</label>
      <div className="flex gap-2">
        <select className="input" style={{ minWidth: 130 }} value={value.comissaoTipo}
          onChange={e => onChange(e.target.value, value.comissaoValor)}>
          <option value="">Sem comissão</option>
          <option value="percentual">% do valor</option>
          <option value="fixo">Valor fixo / un</option>
        </select>
        {value.comissaoTipo && (
          <input type="number" step="0.01" min="0" className="input flex-1"
            placeholder={value.comissaoTipo === 'percentual' ? 'Ex: 10' : 'Ex: 5,00'}
            value={value.comissaoValor} onChange={e => onChange(value.comissaoTipo, e.target.value)} />
        )}
      </div>
      {value.comissaoTipo && value.comissaoValor && (
        <p className="text-xs mt-1.5 text-[#9D4EDD]">
          {value.comissaoTipo === 'percentual'
            ? `${value.comissaoValor}% do total do item`
            : `R$ ${parseFloat(value.comissaoValor || '0').toFixed(2)} por unidade vendida`}
        </p>
      )}
    </div>
  )
}

export default function EstoquePage() {
  const qc = useQueryClient()
  const [busca, setBusca]             = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showNovo, setShowNovo]       = useState(false)
  const [showEntrada, setShowEntrada] = useState<Produto | null>(null)
  const [editando, setEditando]       = useState<Produto | null>(null)
  const [form, setForm]               = useState<Form>(EMPTY)
  const [editForm, setEditForm]       = useState<Partial<Form>>({})
  const [qtdEntrada, setQtdEntrada]   = useState('')
  const [obsEntrada, setObsEntrada]   = useState('')

  const { data: produtos = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos', busca],
    queryFn:  () => fetch(busca ? `/api/produtos?q=${busca}` : '/api/produtos').then(r => r.json()),
  })

  const criarProduto = useMutation({
    mutationFn: (data: Form) =>
      fetch('/api/produtos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Produto cadastrado!'); qc.invalidateQueries({ queryKey: ['produtos'] }); setShowNovo(false); setForm(EMPTY) },
    onError:   () => toast.error('Erro ao cadastrar produto'),
  })
  const editarProduto = useMutation({
    mutationFn: (data: Partial<Form> & { id: string }) =>
      fetch('/api/produtos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Produto atualizado!'); qc.invalidateQueries({ queryKey: ['produtos'] }); setEditando(null); setEditForm({}) },
    onError:   () => toast.error('Erro ao atualizar produto'),
  })
  const registrarEntrada = useMutation({
    mutationFn: ({ produtoId, quantidade, obs }: { produtoId: string; quantidade: string; obs: string }) =>
      fetch('/api/estoque/entrada', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ produtoId, quantidade, observacoes: obs }) }),
    onSuccess: () => { toast.success('Entrada registrada!'); qc.invalidateQueries({ queryKey: ['produtos'] }); setShowEntrada(null); setQtdEntrada(''); setObsEntrada('') },
    onError:   () => toast.error('Erro ao registrar entrada'),
  })

  function handleBarcode(codigo: string) {
    setShowScanner(false); setBusca(codigo)
    const existe = produtos.find(p => p.codigoBarras === codigo)
    if (existe) { setShowEntrada(existe) }
    else { setForm(f => ({ ...f, codigoBarras: codigo })); setShowNovo(true); toast.info(`Código ${codigo} não encontrado. Cadastre.`) }
  }
  function abrirEdicao(p: Produto) {
    setEditando(p)
    setEditForm({ nome: p.nome, precoVenda: p.precoVenda, precoCompra: p.precoCompra ?? '', codigoBarras: p.codigoBarras ?? '', unidade: p.unidade ?? 'un', comissaoTipo: (p.comissaoTipo as any) ?? '', comissaoValor: p.comissaoValor ?? '' })
  }

  const criticos = produtos.filter(p => parseFloat(p.quantidadeEstoque ?? '0') <= parseFloat(p.quantidadeMinima ?? '0') && parseFloat(p.quantidadeMinima ?? '0') > 0)

  return (
    <>
      {showScanner && <BarcodeScanner onDetected={handleBarcode} onClose={() => setShowScanner(false)} />}

      <div className="p-4 lg:p-6 max-w-3xl space-y-4">

        {/* ── HEADER ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-tag mb-1">Inventário</p>
            <h1 className="text-xl font-black text-white">Estoque</h1>
            <p className="text-xs text-white/30 mt-0.5">{produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowScanner(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.25)' }}>
              <ScanLine className="w-5 h-5 text-[#9D4EDD]" />
            </button>
            <button onClick={() => setShowNovo(true)} className="btn-primary text-xs px-4" style={{ height: 40 }}>
              <Plus className="w-3.5 h-3.5" /> Produto
            </button>
          </div>
        </div>

        {/* ── CRÍTICOS ───────────────────────────────── */}
        {criticos.length > 0 && (
          <div className="card p-4" style={{ border: '1px solid rgba(255,159,10,0.3)', background: 'rgba(255,159,10,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
              <p className="font-black text-sm text-[#FF9F0A]">
                {criticos.length} produto{criticos.length > 1 ? 's' : ''} com estoque crítico
              </p>
            </div>
            <div className="space-y-2">
              {criticos.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="text-sm text-white/60">{p.nome}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#FF9F0A]">
                      {p.quantidadeEstoque ?? '0'}/{p.quantidadeMinima} {p.unidade}
                    </span>
                    <button onClick={() => setShowEntrada(p)}
                      className="text-xs px-2 py-1 rounded-lg font-black"
                      style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}>
                      + Entrada
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BUSCA ──────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input className="input pl-10" placeholder="Buscar produto ou código de barras..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {/* ── LISTA ──────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" /></div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-14 card">
            <Package className="w-10 h-10 mx-auto mb-3 text-white/15" />
            <p className="font-bold text-white/35 mb-4">Nenhum produto cadastrado</p>
            <button onClick={() => setShowNovo(true)} className="btn-primary mx-auto px-6">Cadastrar produto</button>
          </div>
        ) : (
          <div className="space-y-2">
            {produtos.map(p => {
              const qtd     = parseFloat(p.quantidadeEstoque ?? '0')
              const min     = parseFloat(p.quantidadeMinima ?? '0')
              const critico = qtd <= min && min > 0
              const temComissao = p.comissaoTipo && p.comissaoValor
              return (
                <div key={p.id} className="card p-0 overflow-hidden">
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ background: critico ? '#FF9F0A' : '#9D4EDD' }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        {/* Ícone */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: critico ? 'rgba(255,159,10,0.1)' : 'rgba(157,78,221,0.1)' }}>
                          <Package className="w-5 h-5" style={{ color: critico ? '#FF9F0A' : '#9D4EDD' }} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm">{p.nome}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {p.codigoBarras && (
                              <span className="text-[10px] font-mono text-white/25">{p.codigoBarras}</span>
                            )}
                            {p.categoriaNome && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black text-[#C77DFF]"
                                style={{ background: 'rgba(157,78,221,0.1)' }}>
                                {p.categoriaNome}
                              </span>
                            )}
                            {temComissao && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-black text-[#34C759]"
                                style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)' }}>
                                <Percent className="w-2.5 h-2.5" />
                                {p.comissaoTipo === 'percentual' ? `${p.comissaoValor}%` : `R$${parseFloat(p.comissaoValor!).toFixed(2)}/un`}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Valor + estoque */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-[#C77DFF]">{formatCurrency(parseFloat(p.precoVenda))}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            {critico && <AlertTriangle className="w-3 h-3 text-[#FF9F0A]" />}
                            <span className="text-xs font-black" style={{ color: critico ? '#FF9F0A' : '#34C759' }}>
                              {qtd} {p.unidade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setShowEntrada(p)}
                          className="flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                          style={{ background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '1px solid rgba(52,199,89,0.2)' }}>
                          <TrendingUp className="w-3.5 h-3.5" /> Entrada
                        </button>
                        <button onClick={() => abrirEdicao(p)}
                          className="flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                          style={{ background: 'rgba(157,78,221,0.08)', color: '#9D4EDD', border: '1px solid rgba(157,78,221,0.2)' }}>
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET: NOVO PRODUTO ─────────────── */}
      <BottomSheet open={showNovo} onClose={() => setShowNovo(false)} title="Novo Produto">
        <div className="space-y-4">
          <div>
            <label className="label">Código de barras</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="EAN-13 ou Code128" value={form.codigoBarras}
                onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))} />
              <button onClick={() => { setShowNovo(false); setShowScanner(true) }}
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.25)' }}>
                <ScanLine className="w-5 h-5 text-[#9D4EDD]" />
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
              <label className="label">Qtd inicial</label>
              <input type="number" className="input" placeholder="0" value={form.estoqueInicial}
                onChange={e => setForm(f => ({ ...f, estoqueInicial: e.target.value }))} />
            </div>
            <div>
              <label className="label">Qtd mínima</label>
              <input type="number" className="input" placeholder="0" value={form.estoqueMinimo}
                onChange={e => setForm(f => ({ ...f, estoqueMinimo: e.target.value }))} />
            </div>
          </div>
          <ComissaoFields
            value={{ comissaoTipo: form.comissaoTipo, comissaoValor: form.comissaoValor }}
            onChange={(t, v) => setForm(f => ({ ...f, comissaoTipo: t as any, comissaoValor: v }))} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowNovo(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => criarProduto.mutate(form)}
              disabled={!form.nome || !form.precoVenda || criarProduto.isPending}
              className="btn-primary flex-1">
              {criarProduto.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET: EDITAR PRODUTO ───────────── */}
      <BottomSheet open={!!editando} onClose={() => setEditando(null)} title="Editar Produto">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do produto *</label>
            <input className="input" value={editForm.nome ?? ''} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço de venda *</label>
              <input type="number" step="0.01" className="input" value={editForm.precoVenda ?? ''}
                onChange={e => setEditForm(f => ({ ...f, precoVenda: e.target.value }))} />
            </div>
            <div>
              <label className="label">Preço de custo</label>
              <input type="number" step="0.01" className="input" value={editForm.precoCompra ?? ''}
                onChange={e => setEditForm(f => ({ ...f, precoCompra: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código de barras</label>
              <input className="input" value={editForm.codigoBarras ?? ''}
                onChange={e => setEditForm(f => ({ ...f, codigoBarras: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unidade</label>
              <select className="input" value={editForm.unidade ?? 'un'}
                onChange={e => setEditForm(f => ({ ...f, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <ComissaoFields
            value={{ comissaoTipo: editForm.comissaoTipo ?? '', comissaoValor: editForm.comissaoValor ?? '' }}
            onChange={(t, v) => setEditForm(f => ({ ...f, comissaoTipo: t as any, comissaoValor: v }))} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditando(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => editarProduto.mutate({ id: editando!.id, ...editForm })}
              disabled={!editForm.nome || !editForm.precoVenda || editarProduto.isPending}
              className="btn-primary flex-1">
              {editarProduto.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET: ENTRADA DE ESTOQUE ──────── */}
      <BottomSheet open={!!showEntrada} onClose={() => setShowEntrada(null)} title="Entrada de Estoque">
        {showEntrada && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)' }}>
              <p className="font-black text-white">{showEntrada.nome}</p>
              <p className="text-xs mt-0.5 text-[#34C759]">
                Estoque atual: {showEntrada.quantidadeEstoque ?? '0'} {showEntrada.unidade}
              </p>
            </div>
            <div>
              <label className="label">Quantidade a entrar *</label>
              <input type="number" step="0.001" className="input text-2xl font-black text-center" placeholder="0"
                value={qtdEntrada} onChange={e => setQtdEntrada(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Observações</label>
              <input className="input" placeholder="Ex: Compra NF 001234" value={obsEntrada}
                onChange={e => setObsEntrada(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEntrada(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => registrarEntrada.mutate({ produtoId: showEntrada.id, quantidade: qtdEntrada, obs: obsEntrada })}
                disabled={!qtdEntrada || parseFloat(qtdEntrada) <= 0 || registrarEntrada.isPending}
                className="flex-1 py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #34C759, #16a34a)', boxShadow: '0 0 20px rgba(52,199,89,0.3)' }}>
                {registrarEntrada.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                  : <><TrendingUp className="w-4 h-4" /> Registrar Entrada</>}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  )
}
