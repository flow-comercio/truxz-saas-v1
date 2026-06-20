'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Users, Loader2, Trash2, Mail, Phone, Shield } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Membro {
  id: string
  nome: string
  email: string
  telefone: string | null
  role: string
  ativo: boolean
  criadoEm: string
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin_loja: { label: 'Admin',    className: 'badge-warning' },
  operador:   { label: 'Operador', className: 'badge-info' },
  cliente:    { label: 'Cliente',  className: 'badge-neutral' },
}

export default function EquipePage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', role: 'operador', senha: 'Win7830@' })

  const { data: equipe = [], isLoading } = useQuery<Membro[]>({
    queryKey: ['equipe'],
    queryFn: () => fetch('/api/equipe').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/equipe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro ao criar membro')
        return json
      }),
    onSuccess: () => {
      toast.success('Membro adicionado!')
      qc.invalidateQueries({ queryKey: ['equipe'] })
      setShowModal(false)
      setForm({ nome: '', email: '', telefone: '', role: 'operador', senha: 'Win7830@' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      fetch(`/api/equipe/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      }),
    onSuccess: () => {
      toast.success('Status atualizado!')
      qc.invalidateQueries({ queryKey: ['equipe'] })
    },
  })

  const membrosAtivos   = equipe.filter(m => m.ativo)
  const membrosInativos = equipe.filter(m => !m.ativo)

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Equipe</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-600 animate-spin" /></div>
      ) : (
        <>
          <div className="space-y-2">
            {membrosAtivos.length === 0 ? (
              <div className="card text-center py-10">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum membro na equipe</p>
              </div>
            ) : membrosAtivos.map(m => {
              const roleCfg = ROLE_CONFIG[m.role] ?? { label: m.role, className: 'badge-neutral' }
              return (
                <div key={m.id} className="card !p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-700 font-bold text-sm">{getInitials(m.nome)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{m.nome}</p>
                        <span className={roleCfg.className}>{roleCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{m.email}
                        </span>
                        {m.telefone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{m.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAtivo.mutate({ id: m.id, ativo: false })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      title="Desativar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {membrosInativos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Inativos</p>
              {membrosInativos.map(m => (
                <div key={m.id} className="card !p-3 opacity-50 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{m.nome}</p>
                    <button
                      onClick={() => toggleAtivo.mutate({ id: m.id, ativo: true })}
                      className="text-xs text-orange-600 font-medium"
                    >
                      Reativar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-5">Adicionar Membro</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="label">Função *</label>
                <select className="input" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="operador">Operador</option>
                  <option value="admin_loja">Administrador</option>
                </select>
              </div>
              <div>
                <label className="label">Senha Inicial *</label>
                <input className="input" value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nome || !form.email || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {createMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
