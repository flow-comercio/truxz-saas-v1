'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Store, MapPin, Phone, Loader2 } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Loja {
  id: string; nome: string; slug: string; email: string
  telefone: string | null; cidade: string | null; estado: string | null
  status: string; planoNome: string | null; criadoEm: string
}

const STATUS_CFG: Record<string, { label: string; variant: 'green' | 'amber' | 'neutral' | 'red'; color: string; barColor: string }> = {
  ativa:    { label: 'Ativa',    variant: 'green',   color: '#34C759', barColor: '#34C759' },
  trial:    { label: 'Trial',    variant: 'amber',   color: '#FF9F0A', barColor: '#FF9F0A' },
  inativa:  { label: 'Inativa',  variant: 'neutral', color: '#55556A', barColor: '#55556A' },
  suspensa: { label: 'Suspensa', variant: 'red',     color: '#FF375F', barColor: '#FF375F' },
}

const FORM_EMPTY = { nome: '', email: '', telefone: '', cidade: '', estado: '', adminNome: '', adminEmail: '', adminSenha: 'Win7830@' }

export default function LojasPage() {
  const qc = useQueryClient()
  const [showSheet, setShowSheet] = useState(false)
  const [form, setForm] = useState(FORM_EMPTY)

  const { data: lojas = [], isLoading } = useQuery<Loja[]>({
    queryKey: ['lojas'],
    queryFn:  () => fetch('/api/lojas').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof FORM_EMPTY) =>
      fetch('/api/lojas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Erro'); return json }),
    onSuccess: () => {
      toast.success('Loja criada! Trial de 14 dias iniciado.')
      qc.invalidateQueries({ queryKey: ['lojas'] })
      setShowSheet(false); setForm(FORM_EMPTY)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const ativas    = lojas.filter(l => l.status === 'ativa').length
  const trial     = lojas.filter(l => l.status === 'trial').length
  const suspensas = lojas.filter(l => l.status === 'suspensa').length

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Master</p>
          <h1 className="text-xl font-black text-white">Lojas</h1>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary text-xs px-4" style={{ height: 38 }}>
          <Plus className="w-3.5 h-3.5" /> Nova Loja
        </button>
      </div>

      {/* ── STAT CHIPS ─────────────────────────────── */}
      {lojas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Total',     value: lojas.length, color: '#9D4EDD' },
            { label: 'Ativas',    value: ativas,        color: '#34C759' },
            { label: 'Trial',     value: trial,         color: '#FF9F0A' },
            { label: 'Suspensas', value: suspensas,     color: '#FF375F' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-shrink-0 card px-4 py-2.5 flex items-center gap-2">
              <span className="text-lg font-black text-white">{value}</span>
              <span className="text-xs font-bold" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── LISTA ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
        </div>
      ) : lojas.length === 0 ? (
        <div className="text-center py-14 card">
          <Store className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="font-bold text-white/35 mb-4">Nenhuma loja cadastrada</p>
          <button onClick={() => setShowSheet(true)} className="btn-primary mx-auto px-6">
            Criar primeira loja
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lojas.map(loja => {
            const cfg = STATUS_CFG[loja.status] ?? STATUS_CFG.inativa
            return (
              <div key={loja.id} className="card p-0 overflow-hidden flex">
                {/* Barra lateral por status */}
                <div className="w-1 flex-shrink-0" style={{ background: cfg.barColor }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar com iniciais */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                      style={{ background: `${cfg.color}12`, color: cfg.color, border: `1.5px solid ${cfg.color}30` }}>
                      {getInitials(loja.nome)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-white text-sm">{loja.nome}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-[10px] text-white/25 mt-0.5 font-mono">/{loja.slug}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {loja.cidade && (
                          <span className="flex items-center gap-1 text-xs text-white/30">
                            <MapPin className="w-3 h-3" />
                            {loja.cidade}{loja.estado ? `, ${loja.estado}` : ''}
                          </span>
                        )}
                        {loja.telefone && (
                          <span className="flex items-center gap-1 text-xs text-white/30">
                            <Phone className="w-3 h-3" />{loja.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] text-white/20">Criada em {formatDate(loja.criadoEm)}</span>
                    {loja.planoNome && <Badge variant="purple">{loja.planoNome}</Badge>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BOTTOM SHEET: NOVA LOJA ────────────────── */}
      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)} title="Nova Loja">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Dados da Loja</p>

          <div>
            <label className="label">Nome da Loja *</label>
            <input className="input" placeholder="Ex: TRUXZ Centro"
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="loja@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(00) 00000-0000"
                value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Cidade</label>
              <input className="input" placeholder="São Paulo"
                value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
            </div>
            <div>
              <label className="label">UF</label>
              <input className="input" placeholder="SP" maxLength={2}
                value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value.toUpperCase() }))} />
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 pt-2">Admin da Loja</p>

          <div>
            <label className="label">Nome do Admin *</label>
            <input className="input" placeholder="Nome completo"
              value={form.adminNome} onChange={e => setForm(f => ({ ...f, adminNome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email do Admin *</label>
            <input type="email" className="input" placeholder="admin@loja.com"
              value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
          </div>
          <div>
            <label className="label">Senha Inicial *</label>
            <input className="input" value={form.adminSenha}
              onChange={e => setForm(f => ({ ...f, adminSenha: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowSheet(false)} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.nome || !form.email || !form.adminNome || !form.adminEmail || createMutation.isPending}
              className="btn-primary flex-1">
              {createMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                : 'Criar Loja'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
