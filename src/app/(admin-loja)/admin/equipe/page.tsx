'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Users, Loader2, ShieldCheck, UserX, UserCheck, X } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'

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

const ROLE_CFG: Record<string, { label: string; variant: 'amber' | 'purple' | 'neutral'; color: string; bg: string }> = {
  admin_loja: { label: 'Admin',    variant: 'amber',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' },
  operador:   { label: 'Operador', variant: 'purple',  color: '#9D4EDD', bg: 'rgba(157,78,221,0.12)' },
  cliente:    { label: 'Cliente',  variant: 'neutral',  color: '#55556A', bg: 'rgba(255,255,255,0.06)' },
}

const PERM_PADRAO: Permissoes = {
  acessoFila: true, acessoOs: true, acessoAgendamentos: true, acessoClientes: true,
  acessoEstoque: false, acessoVendas: false, acessoCatalogo: false,
  acessoFinanceiro: false, acessoRelatorios: false,
  podeEditarServicos: false, podeCancelarOs: false, podeDarDesconto: false,
  podeVerComissoes: true, podeVerRanking: true,
}

export default function EquipePage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd]       = useState(false)
  const [permMembro, setPermMembro] = useState<Membro | null>(null)
  const [permissoes, setPermissoes] = useState<Permissoes>(PERM_PADRAO)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', role: 'operador', senha: '' })

  const { data: equipe = [], isLoading } = useQuery<Membro[]>({
    queryKey: ['equipe'],
    queryFn:  () => fetch('/api/equipe').then(r => r.json()),
  })

  const { isLoading: loadingPerm } = useQuery<Permissoes>({
    queryKey: ['permissoes', permMembro?.operadorId],
    queryFn:  () => fetch(`/api/equipe/${permMembro!.operadorId}/permissoes`).then(r => r.json()),
    enabled:  !!permMembro?.operadorId,
    onSuccess: (data: Permissoes) => setPermissoes({ ...PERM_PADRAO, ...data }),
  } as any)

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Erro'); return j }),
    onSuccess: () => {
      toast.success('Membro adicionado!')
      qc.invalidateQueries({ queryKey: ['equipe'] })
      setShowAdd(false)
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
      fetch(`/api/equipe/${permMembro!.operadorId}/permissoes`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: () => { toast.success('Permissões salvas!'); setPermMembro(null) },
    onError:   (e: Error) => toast.error(e.message),
  })

  const ativos   = equipe.filter(m => m.ativo)
  const inativos = equipe.filter(m => !m.ativo)

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Gestão</p>
          <h1 className="text-xl font-black text-white">Equipe</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {/* ── STATS ──────────────────────────────────── */}
      {equipe.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',    value: equipe.length,  color: '#9D4EDD' },
            { label: 'Ativos',   value: ativos.length,  color: '#34C759' },
            { label: 'Inativos', value: inativos.length, color: '#55556A' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
        </div>
      ) : (
        <>
          {/* ── ATIVOS ─────────────────────────────── */}
          {ativos.length === 0 ? (
            <div className="text-center py-12 card">
              <Users className="w-10 h-10 mx-auto mb-3 text-white/15" />
              <p className="font-bold text-white/35">Nenhum membro na equipe</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto px-5">
                Adicionar membro
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {ativos.map(m => {
                const cfg = ROLE_CFG[m.role] ?? ROLE_CFG.operador
                return (
                  <div key={m.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 font-black text-sm"
                        style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}30` }}>
                        {getInitials(m.nome)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-white text-sm">{m.nome}</p>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-white/35 mt-0.5 truncate">{m.email}</p>
                        {m.telefone && (
                          <p className="text-xs text-white/25 mt-0.5">{m.telefone}</p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {m.role === 'operador' && m.operadorId && (
                          <button
                            onClick={() => { setPermissoes(PERM_PADRAO); setPermMembro(m) }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                            style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.2)' }}
                            title="Permissões">
                            <ShieldCheck className="w-4 h-4 text-[#9D4EDD]" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleAtivo.mutate({ id: m.id, ativo: false })}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/20 hover:text-[#FF375F] hover:bg-red-500/10 transition-all active:scale-90">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── INATIVOS ───────────────────────────── */}
          {inativos.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 pl-1">
                Inativos
              </p>
              <div className="space-y-2">
                {inativos.map(m => (
                  <div key={m.id} className="card p-3 opacity-40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white/40"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {getInitials(m.nome)}
                      </div>
                      <p className="text-sm text-white/60">{m.nome}</p>
                    </div>
                    <button onClick={() => toggleAtivo.mutate({ id: m.id, ativo: true })}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#34C759] hover:opacity-80 transition-opacity">
                      <UserCheck className="w-3.5 h-3.5" /> Reativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── BOTTOM SHEET: ADICIONAR ────────────────── */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Novo Membro">
        <div className="space-y-4">
          {[
            { label: 'Nome *',    key: 'nome',     placeholder: 'Nome completo',      type: 'text' },
            { label: 'E-mail *',  key: 'email',    placeholder: 'email@exemplo.com',  type: 'email' },
            { label: 'Telefone',  key: 'telefone', placeholder: '(11) 99999-9999',    type: 'tel' },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type={f.type} className="input" placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div>
            <label className="label">Função *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'operador',   label: 'Operador',      color: '#9D4EDD' },
                { value: 'admin_loja', label: 'Administrador', color: '#FF9F0A' },
              ].map(opt => {
                const sel = form.role === opt.value
                return (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    className="py-3 rounded-xl text-sm font-black transition-all"
                    style={{
                      background: sel ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${sel ? opt.color + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: sel ? opt.color : '#A0A0B8',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Senha inicial *</label>
            <input type="password" className="input" placeholder="Mín. 6 caracteres"
              value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => createMutation.mutate(form)}
              disabled={!form.nome || !form.email || !form.senha || createMutation.isPending}
              className="btn-primary flex-1">
              {createMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : 'Adicionar'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET: PERMISSÕES ───────────────── */}
      <BottomSheet
        open={!!permMembro}
        onClose={() => setPermMembro(null)}
        title={`Permissões — ${permMembro?.nome ?? ''}`}
      >
        {loadingPerm ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#9D4EDD]" />
          </div>
        ) : (
          <div className="space-y-5">
            {PERM_GRUPOS.map(grupo => (
              <div key={grupo.titulo}>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
                  {grupo.titulo}
                </p>
                <div className="space-y-1.5">
                  {grupo.itens.map(item => {
                    const ativo = (permissoes as any)[item.key] as boolean
                    return (
                      <div key={item.key}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: ativo ? 'rgba(157,78,221,0.06)' : 'rgba(255,255,255,0.02)' }}>
                        <span className="text-sm font-bold"
                          style={{ color: ativo ? '#fff' : '#A0A0B8' }}>
                          {item.label}
                        </span>
                        <div
                          className={`toggle ${ativo ? 'on' : ''}`}
                          onClick={() => setPermissoes(p => ({ ...p, [item.key]: !ativo }))}>
                          <div className="toggle-knob" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => savePerm.mutate(permissoes)}
              disabled={savePerm.isPending}
              className="btn-primary w-full" style={{ height: 52 }}>
              {savePerm.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : <><ShieldCheck className="w-4 h-4" /> Salvar Permissões</>}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
