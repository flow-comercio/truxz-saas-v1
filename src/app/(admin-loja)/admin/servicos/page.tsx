'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Wrench, Clock, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Servico {
  id: string; nome: string; descricao: string | null
  preco: string; duracaoMinutos: number; categoria: string | null; ativo: boolean
}
interface ServicoForm {
  nome: string; descricao: string; preco: string; duracaoMinutos: number; categoria: string
}
const EMPTY: ServicoForm = { nome: '', descricao: '', preco: '', duracaoMinutos: 60, categoria: '' }

const CAT_CORES: Record<string, string> = {
  lavagem:        '#3F8EFF',
  polimento:      '#C77DFF',
  vitrificacao:   '#34C759',
  higienizacao:   '#FF9F0A',
  blindagem:      '#FF375F',
  'wrap-ppf':     '#00D4FF',
}
function catColor(cat: string | null) {
  if (!cat) return '#9D4EDD'
  const k = cat.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
  return CAT_CORES[k] ?? '#9D4EDD'
}

const DURACOES = [30, 45, 60, 90, 120, 180, 240]

export default function ServicosPage() {
  const qc = useQueryClient()
  const [showSheet, setShowSheet] = useState(false)
  const [editing, setEditing]     = useState<Servico | null>(null)
  const [form, setForm]           = useState<ServicoForm>(EMPTY)
  const [filtro, setFiltro]       = useState<'todos' | 'ativos' | 'inativos'>('todos')

  const { data: servicos = [], isLoading } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn:  () => fetch('/api/servicos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: ServicoForm) =>
      editing
        ? fetch(`/api/servicos/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        : fetch('/api/servicos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(editing ? 'Serviço atualizado!' : 'Serviço criado!')
      qc.invalidateQueries({ queryKey: ['servicos'] })
      setShowSheet(false); setEditing(null); setForm(EMPTY)
    },
    onError: () => toast.error('Erro ao salvar serviço'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/servicos/${id}`, { method: 'DELETE' }),
    onSuccess:  () => { toast.success('Serviço removido'); qc.invalidateQueries({ queryKey: ['servicos'] }) },
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      fetch(`/api/servicos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicos'] }),
  })

  function openEdit(s: Servico) {
    setEditing(s)
    setForm({ nome: s.nome, descricao: s.descricao ?? '', preco: s.preco, duracaoMinutos: s.duracaoMinutos, categoria: s.categoria ?? '' })
    setShowSheet(true)
  }
  function openNew() {
    setEditing(null); setForm(EMPTY); setShowSheet(true)
  }

  const lista = servicos.filter(s =>
    filtro === 'ativos' ? s.ativo : filtro === 'inativos' ? !s.ativo : true
  )
  const categorias = [...new Set(servicos.map(s => s.categoria).filter(Boolean))] as string[]

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-4">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Catálogo</p>
          <h1 className="text-xl font-black text-white">Serviços</h1>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Novo
        </button>
      </div>

      {/* ── STATS + FILTRO ─────────────────────────── */}
      {servicos.length > 0 && (
        <div className="flex gap-2">
          {[
            { key: 'todos',    label: `Todos (${servicos.length})` },
            { key: 'ativos',   label: `Ativos (${servicos.filter(s => s.ativo).length})` },
            { key: 'inativos', label: `Inativos (${servicos.filter(s => !s.ativo).length})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key as any)}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
              style={{
                background: filtro === f.key ? 'rgba(157,78,221,0.15)' : 'rgba(255,255,255,0.03)',
                border:     `1px solid ${filtro === f.key ? 'rgba(157,78,221,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color:      filtro === f.key ? '#C77DFF' : '#55556A',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-14 card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(157,78,221,0.08)' }}>
            <Wrench className="w-8 h-8 text-white/15" />
          </div>
          <p className="font-bold text-white/35 mb-4">
            {filtro === 'todos' ? 'Nenhum serviço cadastrado' : `Nenhum serviço ${filtro}`}
          </p>
          {filtro === 'todos' && (
            <button onClick={openNew} className="btn-primary mx-auto px-6">
              Criar primeiro serviço
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map(s => {
            const color = catColor(s.categoria)
            return (
              <div key={s.id} className="card p-4 flex flex-col gap-3"
                style={{ opacity: s.ativo ? 1 : 0.55 }}>

                {/* Topo: ícone + nome + ações */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12`, border: `1.5px solid ${color}30` }}>
                    <Wrench className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm leading-tight">{s.nome}</p>
                    {s.categoria && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag className="w-2.5 h-2.5" style={{ color }} />
                        <span className="text-[10px] font-black uppercase tracking-wide" style={{ color }}>
                          {s.categoria}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-[#C77DFF] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('Remover serviço?')) deleteMutation.mutate(s.id) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-[#FF375F] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                {s.descricao && (
                  <p className="text-xs text-white/35 line-clamp-2">{s.descricao}</p>
                )}

                {/* Rodapé: duração + preço + toggle */}
                <div className="flex items-center justify-between pt-1"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1 text-xs text-white/30">
                    <Clock className="w-3.5 h-3.5" />
                    {minutesToHours(s.duracaoMinutos)}
                  </div>
                  <span className="font-black text-[#C77DFF]">{formatCurrency(parseFloat(s.preco))}</span>
                  <button
                    onClick={() => toggleAtivo.mutate({ id: s.id, ativo: !s.ativo })}
                    className="flex items-center gap-1 text-xs font-bold transition-colors"
                    style={{ color: s.ativo ? '#34C759' : '#55556A' }}>
                    {s.ativo
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft className="w-5 h-5" />}
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BOTTOM SHEET FORM ──────────────────────── */}
      <BottomSheet
        open={showSheet}
        onClose={() => { setShowSheet(false); setEditing(null) }}
        title={editing ? 'Editar Serviço' : 'Novo Serviço'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome do serviço *</label>
            <input className="input" placeholder="Ex: Lavagem Completa"
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea className="input" rows={2} placeholder="Detalhes do serviço..."
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div>
            <label className="label">Categoria</label>
            <input className="input" placeholder="Ex: Lavagem, Polimento, Vitrificação..."
              value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
            {categorias.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {categorias.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, categoria: c }))}
                    className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
                    style={{
                      background: form.categoria === c ? `${catColor(c)}15` : 'rgba(255,255,255,0.04)',
                      color: form.categoria === c ? catColor(c) : '#55556A',
                      border: `1px solid ${form.categoria === c ? catColor(c) + '40' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço (R$) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0,00"
                value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} />
            </div>
            <div>
              <label className="label">Duração</label>
              <select className="input" value={form.duracaoMinutos}
                onChange={e => setForm(f => ({ ...f, duracaoMinutos: parseInt(e.target.value) }))}>
                {DURACOES.map(d => (
                  <option key={d} value={d}>{minutesToHours(d)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowSheet(false); setEditing(null) }} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={() => saveMutation.mutate(form)}
              disabled={!form.nome || !form.preco || saveMutation.isPending}
              className="btn-primary flex-1">
              {saveMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : 'Salvar'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
