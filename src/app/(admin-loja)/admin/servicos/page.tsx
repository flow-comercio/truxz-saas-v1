'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Wrench, Clock, Loader2 } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'

interface Servico { id: string; nome: string; descricao: string | null; preco: string; duracaoMinutos: number; categoria: string | null; ativo: boolean }
interface ServicoForm { nome: string; descricao: string; preco: string; duracaoMinutos: number; categoria: string }
const EMPTY_FORM: ServicoForm = { nome: '', descricao: '', preco: '', duracaoMinutos: 60, categoria: '' }

const modalStyle = { background: '#12101E', border: '1px solid rgba(157,78,221,0.25)' }

export default function ServicosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)
  const [form, setForm] = useState<ServicoForm>(EMPTY_FORM)

  const { data: servicos = [], isLoading } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => fetch('/api/servicos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: ServicoForm) => {
      if (editing) return fetch(`/api/servicos/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      return fetch('/api/servicos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    },
    onSuccess: () => {
      toast.success(editing ? 'Serviço atualizado!' : 'Serviço criado!')
      qc.invalidateQueries({ queryKey: ['servicos'] })
      setShowModal(false); setEditing(null); setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Erro ao salvar serviço'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/servicos/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Serviço removido'); qc.invalidateQueries({ queryKey: ['servicos'] }) },
  })

  function openEdit(s: Servico) {
    setEditing(s)
    setForm({ nome: s.nome, descricao: s.descricao ?? '', preco: s.preco, duracaoMinutos: s.duracaoMinutos, categoria: s.categoria ?? '' })
    setShowModal(true)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Serviços</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Novo Serviço
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
        </div>
      ) : servicos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
          <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: '#55556A' }} />
          <p className="font-semibold" style={{ color: '#A0A0B8' }}>Nenhum serviço cadastrado</p>
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }} className="btn-primary mt-4 mx-auto">
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {servicos.map(s => (
            <div key={s.id} className="p-4 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-white">{s.nome}</p>
                  {s.categoria && (
                    <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#A0A0B8', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s.categoria}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: '#55556A' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C77DFF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#55556A'}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('Remover serviço?')) deleteMutation.mutate(s.id) }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: '#55556A' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F87171'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#55556A'}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s.descricao && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#A0A0B8' }}>{s.descricao}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs" style={{ color: '#55556A' }}>
                  <Clock className="w-3.5 h-3.5" />
                  {minutesToHours(s.duracaoMinutos)}
                </div>
                <span className="font-black" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(s.preco))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-2xl" style={modalStyle}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent)' }} />
            <h2 className="font-black text-white mb-5">{editing ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <div className="space-y-4">
              {[
                { label: 'Nome do Serviço *', key: 'nome', placeholder: 'Ex: Lavagem Completa' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>{f.label}</label>
                  <input className="input" placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Descrição</label>
                <textarea className="input" rows={2} value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do serviço..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Preço (R$) *</label>
                  <input type="number" step="0.01" min="0" className="input"
                    value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Duração (min) *</label>
                  <input type="number" min="15" step="15" className="input"
                    value={form.duracaoMinutos} onChange={e => setForm(f => ({ ...f, duracaoMinutos: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Categoria</label>
                <input className="input" value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ex: Lavagem, Polimento, Vitrificação..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => saveMutation.mutate(form)}
                disabled={!form.nome || !form.preco || saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
