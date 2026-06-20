'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Wrench, Clock, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  preco: string
  duracaoMinutos: number
  categoria: string | null
  ativo: boolean
}

interface ServicoForm {
  nome: string
  descricao: string
  preco: string
  duracaoMinutos: number
  categoria: string
}

const EMPTY_FORM: ServicoForm = {
  nome: '', descricao: '', preco: '', duracaoMinutos: 60, categoria: '',
}

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
      if (editing) {
        return fetch(`/api/servicos/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }
      return fetch('/api/servicos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      toast.success(editing ? 'Serviço atualizado!' : 'Serviço criado!')
      qc.invalidateQueries({ queryKey: ['servicos'] })
      setShowModal(false)
      setEditing(null)
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Erro ao salvar serviço'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/servicos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Serviço removido')
      qc.invalidateQueries({ queryKey: ['servicos'] })
    },
  })

  function openEdit(s: Servico) {
    setEditing(s)
    setForm({ nome: s.nome, descricao: s.descricao ?? '', preco: s.preco, duracaoMinutos: s.duracaoMinutos, categoria: s.categoria ?? '' })
    setShowModal(true)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Serviços</h1>
        <button onClick={openNew} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Novo Serviço
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
        </div>
      ) : servicos.length === 0 ? (
        <div className="card text-center py-12">
          <Wrench className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum serviço cadastrado</p>
          <button onClick={openNew} className="btn-primary mt-4 mx-auto">
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {servicos.map(s => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{s.nome}</p>
                  {s.categoria && <span className="badge-neutral mt-1 inline-block">{s.categoria}</span>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Remover serviço?')) deleteMutation.mutate(s.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s.descricao && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.descricao}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {minutesToHours(s.duracaoMinutos)}
                </div>
                <span className="font-bold text-orange-600">{formatCurrency(parseFloat(s.preco))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-5">
              {editing ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome do Serviço *</label>
                <input className="input" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Lavagem Completa" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input" rows={2} value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do serviço..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Preço (R$) *</label>
                  <input type="number" step="0.01" min="0" className="input"
                    value={form.preco}
                    onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Duração (min) *</label>
                  <input type="number" min="15" step="15" className="input"
                    value={form.duracaoMinutos}
                    onChange={e => setForm(f => ({ ...f, duracaoMinutos: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="label">Categoria</label>
                <input className="input" value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ex: Lavagem, Polimento, Vitrificação..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditing(null) }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.nome || !form.preco || saveMutation.isPending}
                className="btn-primary flex-1"
              >
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
