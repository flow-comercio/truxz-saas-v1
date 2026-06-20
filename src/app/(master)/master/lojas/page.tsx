'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Store, MapPin, Phone, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Loja {
  id: string
  nome: string
  slug: string
  email: string
  telefone: string | null
  cidade: string | null
  estado: string | null
  status: string
  planoNome: string | null
  criadoEm: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  ativa:    { label: 'Ativa',    icon: CheckCircle, className: 'badge-success' },
  trial:    { label: 'Trial',    icon: Clock,       className: 'badge-warning' },
  inativa:  { label: 'Inativa',  icon: AlertCircle, className: 'badge-neutral' },
  suspensa: { label: 'Suspensa', icon: AlertCircle, className: 'badge-danger' },
}

export default function LojasPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cidade: '', estado: '',
    adminNome: '', adminEmail: '', adminSenha: 'Win7830@',
  })

  const { data: lojas = [], isLoading } = useQuery<Loja[]>({
    queryKey: ['lojas'],
    queryFn: () => fetch('/api/lojas').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/lojas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro')
        return json
      }),
    onSuccess: () => {
      toast.success('Loja criada com sucesso! Trial de 14 dias iniciado.')
      qc.invalidateQueries({ queryKey: ['lojas'] })
      setShowModal(false)
      setForm({ nome: '', email: '', telefone: '', cidade: '', estado: '', adminNome: '', adminEmail: '', adminSenha: 'Win7830@' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lojas</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Nova Loja
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
        </div>
      ) : lojas.length === 0 ? (
        <div className="card text-center py-12">
          <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma loja cadastrada</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
            Criar primeira loja
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lojas.map(loja => {
            const cfg = STATUS_CONFIG[loja.status] ?? STATUS_CONFIG.inativa
            const Icon = cfg.icon
            return (
              <div key={loja.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{loja.nome}</p>
                    <p className="text-xs text-gray-400">/{loja.slug}</p>
                  </div>
                  <span className={cfg.className}>
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {loja.cidade && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {loja.cidade}{loja.estado ? `, ${loja.estado}` : ''}
                    </div>
                  )}
                  {loja.telefone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {loja.telefone}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Cadastro: {formatDate(loja.criadoEm)}
                  </span>
                  {loja.planoNome && (
                    <span className="badge-info">{loja.planoNome}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nova Loja */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-5">Nova Loja</h2>
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados da Loja</p>
              <div>
                <label className="label">Nome da Loja *</label>
                <input className="input" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: TRUXZ Centro" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="loja@email.com" />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">Cidade</label>
                  <input className="input" value={form.cidade}
                    onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                    placeholder="São Paulo" />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <input className="input" value={form.estado} maxLength={2}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value.toUpperCase() }))}
                    placeholder="SP" />
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Admin da Loja</p>
              <div>
                <label className="label">Nome do Admin *</label>
                <input className="input" value={form.adminNome}
                  onChange={e => setForm(f => ({ ...f, adminNome: e.target.value }))}
                  placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">Email do Admin *</label>
                <input type="email" className="input" value={form.adminEmail}
                  onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@loja.com" />
              </div>
              <div>
                <label className="label">Senha Inicial *</label>
                <input type="text" className="input" value={form.adminSenha}
                  onChange={e => setForm(f => ({ ...f, adminSenha: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nome || !form.email || !form.adminNome || !form.adminEmail || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {createMutation.isPending ? 'Criando...' : 'Criar Loja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
