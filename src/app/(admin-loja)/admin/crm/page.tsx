'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Bot, Send, Loader2, Phone, Car, X, Target, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/bottom-sheet'

const ESTAGIOS = [
  { key: 'novo',       label: 'Novo Lead',  cor: '#55556A' },
  { key: 'contatado',  label: 'Contatado',  cor: '#FF9F0A' },
  { key: 'proposta',   label: 'Proposta',   cor: '#9D4EDD' },
  { key: 'negociando', label: 'Negociando', cor: '#3F8EFF' },
  { key: 'ganho',      label: 'Ganho',      cor: '#34C759' },
  { key: 'perdido',    label: 'Perdido',    cor: '#FF375F' },
]
const ORIGENS = ['app', 'instagram', 'indicacao', 'whatsapp', 'google', 'walk_in', 'outro']

interface Lead {
  id: string; nome: string; telefone?: string; veiculo?: string
  origem?: string; estagio: string; valorEstimado?: string
  responsavelNome?: string; atualizadoEm: string
}
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const FORM_EMPTY = { nome: '', telefone: '', email: '', veiculo: '', origem: 'outro', valorEstimado: '', observacoes: '' }

export default function CRMPage() {
  const qc = useQueryClient()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showChat, setShowChat]         = useState(false)
  const [showAdd, setShowAdd]           = useState(false)
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([])
  const [chatInput, setChatInput]       = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const [form, setForm]                 = useState(FORM_EMPTY)

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['crm-leads'],
    queryFn:  () => fetch('/api/crm/leads').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: typeof FORM_EMPTY) =>
      fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: () => {
      toast.success('Lead adicionado ao pipeline')
      qc.invalidateQueries({ queryKey: ['crm-leads'] })
      setShowAdd(false); setForm(FORM_EMPTY)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, estagio }: { id: string; estagio: string }) =>
      fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estagio }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  })

  async function sendChat(msg: string) {
    if (!msg.trim()) return
    setChatMsgs(p => [...p, { role: 'user', content: msg }])
    setChatInput(''); setChatLoading(true)
    try {
      const res = await fetch('/api/ai/vendedor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: msg, historico: chatMsgs.slice(-8), contextoLead: selectedLead }),
      })
      const data = await res.json()
      setChatMsgs(p => [...p, { role: 'assistant', content: data.resposta || data.error }])
    } finally { setChatLoading(false) }
  }

  const leadsPorEstagio = (e: string) => leads.filter(l => l.estagio === e)
  const totalPipeline = leads.filter(l => !['ganho', 'perdido'].includes(l.estagio))
    .reduce((s, l) => s + parseFloat(l.valorEstimado ?? '0'), 0)
  const ganhos = leads.filter(l => l.estagio === 'ganho').length

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-tag mb-1">Vendas</p>
          <h1 className="text-xl font-black text-white">CRM Pipeline</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowChat(s => !s); setSelectedLead(null) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: showChat ? 'rgba(157,78,221,0.25)' : 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)' }}>
            <Bot className="w-5 h-5 text-[#9D4EDD]" />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-4" style={{ height: 40 }}>
            <Plus className="w-3.5 h-3.5" /> Novo Lead
          </button>
        </div>
      </div>

      {/* ── MINI STATS ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pipeline',  value: leads.filter(l => !['ganho','perdido'].includes(l.estagio)).length, color: '#9D4EDD' },
          { label: 'Potencial', value: formatCurrency(totalPipeline), color: '#C77DFF' },
          { label: 'Ganhos',    value: ganhos, color: '#34C759' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-wide mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── PIPELINE ───────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
        </div>
      ) : (
        <div className="space-y-4">
          {ESTAGIOS.map(estagio => {
            const itens = leadsPorEstagio(estagio.key)
            if (itens.length === 0 && ['ganho', 'perdido'].includes(estagio.key)) return null
            return (
              <div key={estagio.key}>
                {/* Cabeçalho do estágio */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: estagio.cor }} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: estagio.cor }}>
                    {estagio.label}
                  </span>
                  <span className="text-xs ml-auto font-bold" style={{ color: estagio.cor + '80' }}>
                    {itens.length}
                  </span>
                </div>

                {itens.length === 0 ? (
                  <div className="py-3 px-4 rounded-xl text-xs text-center text-white/15"
                    style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
                    Nenhum lead neste estágio
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itens.map(lead => (
                      <div key={lead.id}
                        className="card p-0 overflow-hidden cursor-pointer transition-all active:scale-[0.99]"
                        onClick={() => { setSelectedLead(lead); setShowChat(true) }}>
                        {/* Barra lateral colorida */}
                        <div className="flex">
                          <div className="w-1 flex-shrink-0" style={{ background: estagio.cor }} />
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-white truncate">{lead.nome}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {lead.telefone && (
                                    <span className="flex items-center gap-1 text-xs text-white/30">
                                      <Phone className="w-3 h-3" />{lead.telefone}
                                    </span>
                                  )}
                                  {lead.veiculo && (
                                    <span className="flex items-center gap-1 text-xs text-white/30">
                                      <Car className="w-3 h-3" />{lead.veiculo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {lead.valorEstimado && parseFloat(lead.valorEstimado) > 0 && (
                                  <p className="font-black text-sm text-[#C77DFF]">
                                    {formatCurrency(parseFloat(lead.valorEstimado))}
                                  </p>
                                )}
                                {lead.origem && (
                                  <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 block"
                                    style={{ background: estagio.cor + '15', color: estagio.cor }}>
                                    {lead.origem.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Botões mover estágio */}
                            {!['ganho', 'perdido'].includes(lead.estagio) && (
                              <div className="flex gap-1.5 mt-3 flex-wrap" onClick={e => e.stopPropagation()}>
                                {ESTAGIOS.filter(e => e.key !== lead.estagio && e.key !== 'perdido').map(e => (
                                  <button key={e.key}
                                    onClick={() => moveMutation.mutate({ id: lead.id, estagio: e.key })}
                                    className="text-[10px] px-2 py-1 rounded-lg font-black transition-all"
                                    style={{ background: e.cor + '12', color: e.cor, border: `1px solid ${e.cor}25` }}>
                                    → {e.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── CHAT FLUTUANTE AGENTE IA ───────────────── */}
      {showChat && (
        <div className="fixed bottom-24 right-4 w-80 z-50 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#12101E', border: '1px solid rgba(157,78,221,0.3)' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3"
            style={{ borderBottom: '1px solid rgba(157,78,221,0.12)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(157,78,221,0.15)' }}>
                <Bot className="w-4 h-4 text-[#9D4EDD]" />
              </div>
              <div>
                <p className="font-black text-white text-xs">Agente Vendedor IA</p>
                {selectedLead && (
                  <p className="text-[10px] text-white/30">Lead: {selectedLead.nome}</p>
                )}
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/25 hover:text-white/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sugestões rápidas */}
          {chatMsgs.length === 0 && (
            <div className="p-3 grid gap-1.5">
              {[
                '💰 Sugestão de upsell para este lead',
                '📉 Estratégia de downsell',
                '➕ Order bump para fechar agora',
                '🔀 Crosssell de serviços complementares',
              ].map(q => (
                <button key={q} onClick={() => sendChat(q)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl font-semibold transition-all text-white/50 hover:text-white/80"
                  style={{ background: 'rgba(157,78,221,0.06)', border: '1px solid rgba(157,78,221,0.12)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Mensagens */}
          <div className="h-52 overflow-y-auto p-3 space-y-2">
            {chatMsgs.map((m, i) => (
              <div key={i}
                className={`text-xs p-2.5 rounded-xl leading-relaxed ${m.role === 'user' ? 'ml-6' : 'mr-6'}`}
                style={{
                  background: m.role === 'user' ? 'rgba(157,78,221,0.18)' : 'rgba(255,255,255,0.04)',
                  color: '#E0E0E8',
                }}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="mr-6 px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-3 h-3 animate-spin text-[#9D4EDD]" />
                <span className="text-xs text-white/25">Pensando...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 flex gap-2 items-center"
            style={{ borderTop: '1px solid rgba(157,78,221,0.12)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat(chatInput)}
              placeholder="Pergunte ao agente..."
              className="flex-1 text-xs bg-transparent outline-none text-white placeholder:text-white/20"
            />
            <button onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              className="transition-all disabled:opacity-30">
              <Send className="w-4 h-4 text-[#9D4EDD]" />
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET: NOVO LEAD ────────────────── */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Novo Lead">
        <div className="space-y-4">
          {[
            { label: 'Nome *',           key: 'nome',           type: 'text',   placeholder: 'Nome do cliente' },
            { label: 'Telefone',         key: 'telefone',       type: 'tel',    placeholder: '(00) 00000-0000' },
            { label: 'E-mail',           key: 'email',          type: 'email',  placeholder: 'email@exemplo.com' },
            { label: 'Veículo',          key: 'veiculo',        type: 'text',   placeholder: 'Ex: Honda Civic 2020' },
            { label: 'Valor Estimado',   key: 'valorEstimado',  type: 'number', placeholder: '0,00' },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type={f.type} className="input" placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div>
            <label className="label">Origem</label>
            <div className="flex gap-1.5 flex-wrap">
              {ORIGENS.map(o => (
                <button key={o} onClick={() => setForm(p => ({ ...p, origem: o }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-black transition-all capitalize"
                  style={{
                    background: form.origem === o ? 'rgba(157,78,221,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.origem === o ? 'rgba(157,78,221,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: form.origem === o ? '#C77DFF' : '#55556A',
                  }}>
                  {o.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} placeholder="Anotações iniciais..."
              value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => createMutation.mutate(form)}
              disabled={!form.nome || createMutation.isPending}
              className="btn-primary flex-1">
              {createMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : 'Adicionar Lead'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
