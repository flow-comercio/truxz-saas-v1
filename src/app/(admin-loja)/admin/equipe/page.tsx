'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Users, Loader2, Trash2, Mail, Phone, ShieldCheck, X } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Membro {
  id: string; nome: string; email: string; telefone: string | null
  role: string; ativo: boolean; operadorId: string | null
}

interface Permissoes {
  acessoFila: boolean; acessoOs: boolean; acessoEstoque: boolean
  acessoFinanceiro: boolean; acessoRelatorios: boolean; acessoVendas: boolean
  acessoClientes: boolean; acessoAgendamentos: boolean; acessoCatalogo: boolean
  podeEditarServicos: boolean; podeCancelarOs: boolean; podeDarDesconto: boolean
  podeVerComissoes: boolean; podeVerRanking: boolean
}

const PERM_GRUPOS = [
  {
    titulo: 'Módulos',
    itens: [
      { key: 'acessoFila',         label: 'Fila de serviços' },
      { key: 'acessoOs',           label: 'Ordens de Serviço' },
      { key: 'acessoAgendamentos', label: 'Agendamentos' },
      { key: 'acessoClientes',     label: 'Clientes' },
      { key: 'acessoEstoque',      label: 'Estoque' },
      { key: 'acessoVendas',       label: 'PDV / Vendas' },
      { key: 'acessoCatalogo',     label: 'Catálogo' },
      { key: 'acessoFinanceiro',   label: 'Financeiro' },
      { key: 'acessoRelatorios',   label: 'Relatórios' },
    ],
  },
  {
    titulo: 'Ações',
    itens: [
      { key: 'podeEditarServicos', label: 'Editar serviços' },
      { key: 'podeCancelarOs',     label: 'Cancelar OS' },
      { key: 'podeDarDesconto',    label: 'Aplicar desconto' },
      { key: 'podeVerComissoes',   label: 'Ver comissões' },
      { key: 'podeVerRanking',     label: 'Ver ranking' },
    ],
  },
]

const ROLE_MAP: Record<string, { label: string; variant: 'amber' | 'purple' | 'neutral' }> = {
  admin_loja: { label: 'Admin',    variant: 'amber' },
  operador:   { label: 'Operador', variant: 'purple' },
  cliente:    { label: 'Cliente',  variant: 'neutral' },
}

const modalStyle = { background: '#12101E', border: '1px solid rgba(157,78,221,0.25)' }

const PERM_PADRAO: Permissoes = {
  acessoFila: true, acessoOs: true, acessoAgendamentos: true, acessoClientes: true,
  acessoEstoque: false, acessoVendas: false, acessoCatalogo: false,
  acessoFinanceiro: false, acessoRelatorios: false,
  podeEditarServicos: false, podeCancelarOs: false, podeDarDesconto: false,
  podeVerComissoes: true, podeVerRanking: true,
}

export default function EquipePage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [permModal, setPermModal] = useState<Membro | null>(null)
  const [permissoes, setPermissoes] = useState<Permissoes>(PERM_PADRAO)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', role: 'operador', senha: '' })

  const { data: equipe = [], isLoading } = useQuery<Membro[]>({
    queryKey: ['equipe'],
    queryFn: () => fetch('/api/equipe').then(r => r.json()),
  })

  const { isLoading: loadingPerm } = useQuery<Permissoes>({
    queryKey: ['permissoes', permModal?.operadorId],
    queryFn: () => fetch(`/api/equipe/${permModal!.operadorId}/permissoes`).then(r => r.json()),
    enabled: !!permModal?.operadorId,
    onSuccess: (data: Permissoes) => setPermissoes({ ...PERM_PADRAO, ...data }),
  } as any)

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Erro'); return json }),
    onSuccess: () => {
      toast.success('Membro adicionado!')
      qc.invalidateQueries({ queryKey: ['equipe'] })
      setShowModal(false)
      setForm({ nome: '', email: '', telefone: '', role: 'operador', senha: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      fetch(`/api/equipe/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo }) }),
    onSuccess: () => { toast.success('Status atualizado!'); qc.invalidateQueries({ queryKey: ['equipe'] }) },
  })

  const savePerm = useMutation({
    mutationFn: (data: Permissoes) =>
      fetch(`/api/equipe/${permModal!.operadorId}/permissoes`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: () => { toast.success('Permissões salvas!'); setPermModal(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  function abrirPermissoes(m: Membro) {
    setPermissoes(PERM_PADRAO)
    setPermModal(m)
  }

  const membrosAtivos = equipe.filter(m => m.ativo)
  const membrosInativos = equipe.filter(m => !m.ativo)

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Equipe</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {membrosAtivos.length === 0 ? (
              <div className="text-center py-10 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#55556A' }} />
                <p className="font-semibold" style={{ color: '#A0A0B8' }}>Nenhum membro na equipe</p>
              </div>
            ) : membrosAtivos.map(m => {
              const roleCfg = ROLE_MAP[m.role] ?? { label: m.role, variant: 'neutral' as const }
              return (
                <div key={m.id} className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', backdropFilter: 'blur(10px)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                      style={{ background: 'linear-gradient(135deg, rgba(157,78,221,0.3), rgba(123,47,190,0.2))', color: '#C77DFF', border: '1px solid rgba(157,78,221,0.3)' }}>
                      {getInitials(m.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{m.nome}</p>
                        <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs flex items-center gap-1" style={{ color: '#55556A' }}>
                          <Mail className="w-3 h-3" />{m.email}
                        </span>
                        {m.telefone && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#55556A' }}>
                            <Phone className="w-3 h-3" />{m.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {m.role === 'operador' && m.operadorId && (
                        <button
                          onClick={() => abrirPermissoes(m)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#9D4EDD', background: 'rgba(157,78,221,0.1)' }}
                          title="Permissões">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleAtivo.mutate({ id: m.id, ativo: false })}
                        className="p-1.5 rounded-lg transition-colors" style={{ color: '#55556A' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F87171'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#55556A'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {membrosInativos.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>Inativos</p>
              {membrosInativos.map(m => (
                <div key={m.id} className="p-3 rounded-2xl opacity-50 mb-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: '#A0A0B8' }}>{m.nome}</p>
                    <button onClick={() => toggleAtivo.mutate({ id: m.id, ativo: true })}
                      className="text-xs font-bold" style={{ color: '#9D4EDD' }}>
                      Reativar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: Adicionar Membro */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-2xl" style={modalStyle}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent)' }} />
            <h2 className="font-black text-white mb-5">Adicionar Membro</h2>
            <div className="space-y-4">
              {[
                { label: 'Nome *', key: 'nome', placeholder: 'Nome completo' },
                { label: 'Email *', key: 'email', placeholder: 'email@exemplo.com', type: 'email' },
                { label: 'Telefone', key: 'telefone', placeholder: '(00) 00000-0000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>{f.label}</label>
                  <input type={f.type ?? 'text'} className="input" placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Função *</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="operador">Operador</option>
                  <option value="admin_loja">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Senha Inicial *</label>
                <input className="input" type="password" value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mín. 6 caracteres" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => createMutation.mutate(form)}
                disabled={!form.nome || !form.email || !form.senha || createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {createMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permissões */}
      {permModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl" style={modalStyle}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent)' }} />

            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h2 className="font-black text-white">Permissões</h2>
                <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>{permModal.nome}</p>
              </div>
              <button onClick={() => setPermModal(null)} className="p-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0B8' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 max-h-[70vh] overflow-y-auto space-y-5">
              {loadingPerm ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#9D4EDD' }} />
                </div>
              ) : PERM_GRUPOS.map(grupo => (
                <div key={grupo.titulo}>
                  <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>
                    {grupo.titulo}
                  </p>
                  <div className="space-y-2">
                    {grupo.itens.map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-sm text-white">{item.label}</span>
                        <button
                          onClick={() => setPermissoes(p => ({ ...p, [item.key]: !(p as any)[item.key] }))}
                          className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                          style={{
                            background: (permissoes as any)[item.key]
                              ? 'linear-gradient(135deg,#9D4EDD,#7B2FBE)'
                              : 'rgba(255,255,255,0.1)',
                          }}>
                          <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: (permissoes as any)[item.key] ? '24px' : '4px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => savePerm.mutate(permissoes)}
                disabled={savePerm.isPending}
                className="btn-primary w-full">
                {savePerm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {savePerm.isPending ? 'Salvando...' : 'Salvar Permissões'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
