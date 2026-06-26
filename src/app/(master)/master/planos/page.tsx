'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Package, Check, Loader2, Pencil, Users, CalendarDays, FileBarChart, MessageSquare, Bot } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Plano {
  id: string; nome: string; tipo: string; preco: string; descricao: string | null
  limiteAgendamentosMes: number; limiteOperadores: number
  permiteRelatorios: boolean; permiteWhatsapp: boolean; permiteIA: boolean; ativo: boolean
}

const TIPO_CFG: Record<string, { variant: 'neutral' | 'purple' | 'amber'; color: string; bg: string; border: string }> = {
  basico:       { variant: 'neutral', color: '#A0A0B8', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  profissional: { variant: 'purple',  color: '#C77DFF', bg: 'rgba(157,78,221,0.1)',   border: 'rgba(157,78,221,0.3)' },
  premium:      { variant: 'amber',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)',   border: 'rgba(255,159,10,0.3)' },
}

const FEATURES = [
  { key: 'permiteRelatorios', label: 'Relatórios',  Icon: FileBarChart },
  { key: 'permiteWhatsapp',   label: 'WhatsApp',    Icon: MessageSquare },
  { key: 'permiteIA',         label: 'IA',           Icon: Bot },
] as const

const FORM_EMPTY = { nome: '', tipo: 'basico', preco: '', descricao: '', limiteAgendamentosMes: 100, limiteOperadores: 3, permiteRelatorios: false, permiteWhatsapp: false, permiteIA: false }

export default function PlanosPage() {
  const qc = useQueryClient()
  const [showSheet, setShowSheet] = useState(false)
  const [editing, setEditing]     = useState<Plano | null>(null)
  const [form, setForm]           = useState(FORM_EMPTY)

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos-master'],
    queryFn:  () => fetch('/api/planos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof FORM_EMPTY) =>
      editing
        ? fetch(`/api/planos/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        : fetch('/api/planos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(editing ? 'Plano atualizado!' : 'Plano criado!')
      qc.invalidateQueries({ queryKey: ['planos-master'] })
      setShowSheet(false); setEditing(null); setForm(FORM_EMPTY)
    },
    onError: () => toast.error('Erro ao salvar plano'),
  })

  function openEdit(p: Plano) {
    setEditing(p)
    setForm({ nome: p.nome, tipo: p.tipo, preco: p.preco, descricao: p.descricao ?? '', limiteAgendamentosMes: p.limiteAgendamentosMes, limiteOperadores: p.limiteOperadores, permiteRelatorios: p.permiteRelatorios, permiteWhatsapp: p.permiteWhatsapp, permiteIA: p.permiteIA })
    setShowSheet(true)
  }

  const tipoAtual = TIPO_CFG[form.tipo] ?? TIPO_CFG.basico

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Master</p>
          <h1 className="text-xl font-black text-white">Planos</h1>
        </div>
        <button onClick={() => { setEditing(null); setForm(FORM_EMPTY); setShowSheet(true) }}
          className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Novo Plano
        </button>
      </div>

      {/* ── GRID DE PLANOS ─────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
        </div>
      ) : planos.length === 0 ? (
        <div className="text-center py-14 card">
          <Package className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="font-bold text-white/35 mb-4">Nenhum plano cadastrado</p>
          <button onClick={() => setShowSheet(true)} className="btn-primary mx-auto px-6">
            Criar primeiro plano
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map(p => {
            const tier = TIPO_CFG[p.tipo] ?? TIPO_CFG.basico
            return (
              <div key={p.id} className="card p-5 flex flex-col gap-4 relative"
                style={{ opacity: p.ativo ? 1 : 0.5 }}>
                {/* Editar */}
                <button onClick={() => openEdit(p)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-[#C77DFF] transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Tier + nome */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: tier.bg, border: `1.5px solid ${tier.border}` }}>
                      <Package className="w-4 h-4" style={{ color: tier.color }} />
                    </div>
                    <Badge variant={tier.variant}>{p.tipo}</Badge>
                    {!p.ativo && <Badge variant="neutral">Inativo</Badge>}
                  </div>
                  <h3 className="font-black text-white text-lg leading-tight">{p.nome}</h3>
                  {p.descricao && <p className="text-xs text-white/35 mt-1">{p.descricao}</p>}
                </div>

                {/* Preço */}
                <div>
                  <span className="text-3xl font-black text-white">{formatCurrency(parseFloat(p.preco))}</span>
                  <span className="text-sm text-white/30">/mês</span>
                </div>

                {/* Limites */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl text-center"
                    style={{ background: 'rgba(157,78,221,0.06)', border: '1px solid rgba(157,78,221,0.12)' }}>
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <CalendarDays className="w-3 h-3 text-[#9D4EDD]" />
                      <span className="text-sm font-black text-white">{p.limiteAgendamentosMes}</span>
                    </div>
                    <p className="text-[10px] text-white/25">ags/mês</p>
                  </div>
                  <div className="p-2 rounded-xl text-center"
                    style={{ background: 'rgba(63,142,255,0.06)', border: '1px solid rgba(63,142,255,0.12)' }}>
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Users className="w-3 h-3 text-[#3F8EFF]" />
                      <span className="text-sm font-black text-white">{p.limiteOperadores}</span>
                    </div>
                    <p className="text-[10px] text-white/25">operadores</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex gap-1.5 flex-wrap">
                  {FEATURES.map(({ key, label, Icon }) => (
                    p[key] ? (
                      <div key={key} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black text-[#34C759]"
                        style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)' }}>
                        <Icon className="w-2.5 h-2.5" />{label}
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BOTTOM SHEET: FORM ─────────────────────── */}
      <BottomSheet open={showSheet} onClose={() => { setShowSheet(false); setEditing(null) }}
        title={editing ? 'Editar Plano' : 'Novo Plano'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input" placeholder="Ex: Profissional"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
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
            <input type="number" step="0.01" className="input" placeholder="197.90"
              value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} />
          </div>

          <div>
            <label className="label">Descrição</label>
            <input className="input" placeholder="Resumo do plano..."
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Agendamentos/mês</label>
              <input type="number" className="input" value={form.limiteAgendamentosMes}
                onChange={e => setForm(f => ({ ...f, limiteAgendamentosMes: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Operadores</label>
              <input type="number" className="input" value={form.limiteOperadores}
                onChange={e => setForm(f => ({ ...f, limiteOperadores: +e.target.value }))} />
            </div>
          </div>

          {/* Toggles de features */}
          <div>
            <label className="label mb-3 block">Funcionalidades</label>
            <div className="space-y-2">
              {FEATURES.map(({ key, label, Icon }) => {
                const ativo = form[key] as boolean
                return (
                  <div key={key}
                    className="flex items-center justify-between p-3 rounded-xl transition-all"
                    style={{ background: ativo ? 'rgba(52,199,89,0.06)' : 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: ativo ? '#34C759' : '#55556A' }} />
                      <span className="text-sm font-bold" style={{ color: ativo ? '#fff' : '#A0A0B8' }}>
                        {label}
                      </span>
                    </div>
                    <div className={`toggle ${ativo ? 'on' : ''}`}
                      onClick={() => setForm(f => ({ ...f, [key]: !ativo }))}>
                      <div className="toggle-knob" />
                    </div>
                  </div>
                )
              })}
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
