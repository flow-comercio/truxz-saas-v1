'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Package, Check, Loader2, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Plano {
  id: string; nome: string; tipo: string; preco: string; descricao: string | null
  limiteAgendamentosMes: number; limiteOperadores: number
  permiteRelatorios: boolean; permiteWhatsapp: boolean; permiteIA: boolean; ativo: boolean
}

const TIPO_COLOR: Record<string, string> = {
  basico: 'badge-neutral', profissional: 'badge-info', premium: 'badge-warning',
}

export default function PlanosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Plano | null>(null)
  const [form, setForm] = useState({
    nome: '', tipo: 'basico', preco: '', descricao: '',
    limiteAgendamentosMes: 100, limiteOperadores: 3,
    permiteRelatorios: false, permiteWhatsapp: false, permiteIA: false,
  })

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos-master'],
    queryFn: () => fetch('/api/planos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (editing) {
        return fetch(`/api/planos/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      }
      return fetch('/api/planos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    },
    onSuccess: () => {
      toast.success(editing ? 'Plano atualizado!' : 'Plano criado!')
      qc.invalidateQueries({ queryKey: ['planos-master'] })
      setShowModal(false); setEditing(null)
    },
    onError: () => toast.error('Erro ao salvar plano'),
  })

  function openEdit(p: Plano) {
    setEditing(p)
    setForm({ nome: p.nome, tipo: p.tipo, preco: p.preco, descricao: p.descricao ?? '', limiteAgendamentosMes: p.limiteAgendamentosMes, limiteOperadores: p.limiteOperadores, permiteRelatorios: p.permiteRelatorios, permiteWhatsapp: p.permiteWhatsapp, permiteIA: p.permiteIA })
    setShowModal(true)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Planos</h1>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Novo Plano
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map(p => (
            <div key={p.id} className="card relative">
              <button onClick={() => openEdit(p)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span className={TIPO_COLOR[p.tipo]}>{p.tipo}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{p.nome}</h3>
                {p.descricao && <p className="text-xs text-gray-500 mt-1">{p.descricao}</p>}
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(parseFloat(p.preco))}
                <span className="text-sm font-normal text-gray-400">/mês</span>
              </p>
              <ul className="mt-4 space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Até {p.limiteAgendamentosMes} agendamentos/mês
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Até {p.limiteOperadores} operadores
                </li>
                {p.permiteRelatorios && (
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />Relatórios
                  </li>
                )}
                {p.permiteWhatsapp && (
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />Notificações WhatsApp
                  </li>
                )}
                {p.permiteIA && (
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />Inteligência Artificial
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-5">{editing ? 'Editar Plano' : 'Novo Plano'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome *</label>
                  <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Profissional" />
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="basico">Básico</option>
                    <option value="profissional">Profissional</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Preço mensal (R$) *</label>
                <input type="number" step="0.01" className="input" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="197.90" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <input className="input" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Limite Agendamentos/mês</label>
                  <input type="number" className="input" value={form.limiteAgendamentosMes} onChange={e => setForm(f => ({ ...f, limiteAgendamentosMes: +e.target.value }))} />
                </div>
                <div>
                  <label className="label">Limite Operadores</label>
                  <input type="number" className="input" value={form.limiteOperadores} onChange={e => setForm(f => ({ ...f, limiteOperadores: +e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                {([['permiteRelatorios','Relatórios'],['permiteWhatsapp','WhatsApp'],['permiteIA','IA']] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-orange-600" checked={form[key] as boolean}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={!form.nome || !form.preco || saveMutation.isPending} className="btn-primary flex-1">
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
