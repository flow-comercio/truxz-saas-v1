'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Package, Check, Loader2, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Plano {
  id: string; nome: string; tipo: string; preco: string; descricao: string | null
  limiteAgendamentosMes: number; limiteOperadores: number
  permiteRelatorios: boolean; permiteWhatsapp: boolean; permiteIA: boolean; ativo: boolean
}

const TIPO_VARIANT: Record<string, 'neutral' | 'purple' | 'amber'> = {
  basico: 'neutral', profissional: 'purple', premium: 'amber',
}

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1.25rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.4), transparent)' }
const modalStyle = { background: '#12101E', border: '1px solid rgba(157,78,221,0.25)', borderRadius: 16 }

export default function PlanosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Plano | null>(null)
  const [form, setForm] = useState({ nome: '', tipo: 'basico', preco: '', descricao: '', limiteAgendamentosMes: 100, limiteOperadores: 3, permiteRelatorios: false, permiteWhatsapp: false, permiteIA: false })

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos-master'],
    queryFn: () => fetch('/api/planos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (editing) return fetch(`/api/planos/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
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
    <div className="p-4 lg:p-6 space-y-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Planos</h1>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Novo Plano
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map(p => (
            <div key={p.id} style={card}>
              <div style={shimmer} />
              <button onClick={() => openEdit(p)}
                className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
                style={{ color: '#55556A' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C77DFF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#55556A'}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(157,78,221,0.12)', border: '1px solid rgba(157,78,221,0.25)' }}>
                    <Package className="w-4 h-4" style={{ color: '#9D4EDD' }} />
                  </div>
                  <Badge variant={TIPO_VARIANT[p.tipo] ?? 'neutral'}>{p.tipo}</Badge>
                </div>
                <h3 className="font-black text-white text-lg">{p.nome}</h3>
                {p.descricao && <p className="text-xs mt-1" style={{ color: '#A0A0B8' }}>{p.descricao}</p>}
              </div>
              <p className="text-3xl font-black text-white">
                {formatCurrency(parseFloat(p.preco))}
                <span className="text-sm font-normal" style={{ color: '#55556A' }}>/mês</span>
              </p>
              <ul className="mt-4 space-y-1.5">
                {[
                  `Até ${p.limiteAgendamentosMes} agendamentos/mês`,
                  `Até ${p.limiteOperadores} operadores`,
                  ...(p.permiteRelatorios ? ['Relatórios completos'] : []),
                  ...(p.permiteWhatsapp ? ['Notificações WhatsApp'] : []),
                  ...(p.permiteIA ? ['Inteligência Artificial'] : []),
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs" style={{ color: '#A0A0B8' }}>
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9D4EDD' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="relative w-full sm:max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" style={modalStyle}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent)' }} />
            <h2 className="font-black text-white mb-5">{editing ? 'Editar Plano' : 'Novo Plano'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Nome *</label>
                  <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Profissional" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Tipo *</label>
                  <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="basico">Básico</option>
                    <option value="profissional">Profissional</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Preço mensal (R$) *</label>
                <input type="number" step="0.01" className="input" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="197.90" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Descrição</label>
                <input className="input" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Agendamentos/mês</label>
                  <input type="number" className="input" value={form.limiteAgendamentosMes} onChange={e => setForm(f => ({ ...f, limiteAgendamentosMes: +e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Operadores</label>
                  <input type="number" className="input" value={form.limiteOperadores} onChange={e => setForm(f => ({ ...f, limiteOperadores: +e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                {([['permiteRelatorios','Relatórios'],['permiteWhatsapp','WhatsApp'],['permiteIA','IA']] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                      <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
                        style={{ background: form[key] ? '#9D4EDD' : 'rgba(255,255,255,0.05)', border: form[key] ? 'none' : '1px solid rgba(157,78,221,0.3)' }}>
                        {form[key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm" style={{ color: '#A0A0B8' }}>{label}</span>
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
