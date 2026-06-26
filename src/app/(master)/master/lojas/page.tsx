'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Store, MapPin, Phone, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Loja {
  id: string; nome: string; slug: string; email: string
  telefone: string | null; cidade: string | null; estado: string | null
  status: string; planoNome: string | null; criadoEm: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'green' | 'amber' | 'neutral' | 'red' }> = {
  ativa:    { label: 'Ativa',    variant: 'green' },
  trial:    { label: 'Trial',    variant: 'amber' },
  inativa:  { label: 'Inativa',  variant: 'neutral' },
  suspensa: { label: 'Suspensa', variant: 'red' },
}

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.35), transparent)' }
const modalStyle = { background: '#12101E', border: '1px solid rgba(157,78,221,0.25)', borderRadius: 16 }

export default function LojasPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cidade: '', estado: '', adminNome: '', adminEmail: '', adminSenha: 'Win7830@' })

  const { data: lojas = [], isLoading } = useQuery<Loja[]>({
    queryKey: ['lojas'],
    queryFn: () => fetch('/api/lojas').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/lojas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Erro'); return json }),
    onSuccess: () => {
      toast.success('Loja criada! Trial de 14 dias iniciado.')
      qc.invalidateQueries({ queryKey: ['lojas'] })
      setShowModal(false)
      setForm({ nome: '', email: '', telefone: '', cidade: '', estado: '', adminNome: '', adminEmail: '', adminSenha: 'Win7830@' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 lg:p-6 space-y-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Lojas</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Nova Loja
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
        </div>
      ) : lojas.length === 0 ? (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
          <Store className="w-10 h-10 mx-auto mb-3" style={{ color: '#55556A' }} />
          <p className="font-semibold" style={{ color: '#A0A0B8' }}>Nenhuma loja cadastrada</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">Criar primeira loja</button>
        </div>
      ) : (
        <div className="space-y-3">
          {lojas.map(loja => {
            const cfg = STATUS_CONFIG[loja.status] ?? STATUS_CONFIG.inativa
            return (
              <div key={loja.id} style={card}>
                <div style={shimmer} />
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-black text-white">{loja.nome}</p>
                    <p className="text-xs" style={{ color: '#55556A' }}>/{loja.slug}</p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
                <div className="space-y-1">
                  {loja.cidade && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#A0A0B8' }}>
                      <MapPin className="w-3 h-3" />
                      {loja.cidade}{loja.estado ? `, ${loja.estado}` : ''}
                    </div>
                  )}
                  {loja.telefone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#A0A0B8' }}>
                      <Phone className="w-3 h-3" />{loja.telefone}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(157,78,221,0.1)' }}>
                  <span className="text-xs" style={{ color: '#55556A' }}>Cadastro: {formatDate(loja.criadoEm)}</span>
                  {loja.planoNome && <Badge variant="purple">{loja.planoNome}</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nova Loja */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="relative w-full sm:max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" style={modalStyle}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent)' }} />
            <h2 className="font-black text-white mb-5">Nova Loja</h2>
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#55556A' }}>Dados da Loja</p>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Nome da Loja *</label>
                <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: TRUXZ Centro" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Email *</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="loja@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Telefone</label>
                  <input className="input" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Cidade</label>
                  <input className="input" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="São Paulo" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>UF</label>
                  <input className="input" value={form.estado} maxLength={2} onChange={e => setForm(f => ({ ...f, estado: e.target.value.toUpperCase() }))} placeholder="SP" />
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-widest pt-2" style={{ color: '#55556A' }}>Admin da Loja</p>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Nome do Admin *</label>
                <input className="input" value={form.adminNome} onChange={e => setForm(f => ({ ...f, adminNome: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Email do Admin *</label>
                <input type="email" className="input" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@loja.com" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Senha Inicial *</label>
                <input className="input" value={form.adminSenha} onChange={e => setForm(f => ({ ...f, adminSenha: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nome || !form.email || !form.adminNome || !form.adminEmail || createMutation.isPending}
                className="btn-primary flex-1">
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
