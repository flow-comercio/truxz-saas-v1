'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Bot, Send, Loader2, User, Phone, Car, X,
  ChevronRight, MessageSquare, TrendingUp, Target
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const ESTAGIOS = [
  { key: 'novo',        label: 'Novo Lead',     cor: '#6B7280' },
  { key: 'contatado',   label: 'Contatado',     cor: '#F59E0B' },
  { key: 'proposta',    label: 'Proposta',      cor: '#9D4EDD' },
  { key: 'negociando',  label: 'Negociando',    cor: '#3B82F6' },
  { key: 'ganho',       label: 'Ganho ✓',       cor: '#10B981' },
  { key: 'perdido',     label: 'Perdido',       cor: '#EF4444' },
]

const ORIGENS = ['app','instagram','indicacao','whatsapp','google','walk_in','outro']

const glass = (cor?: string) => ({
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${cor ? cor + '30' : 'rgba(157,78,221,0.15)'}`,
  borderRadius: 14,
})

interface Lead {
  id: string
  nome: string
  telefone?: string
  veiculo?: string
  origem?: string
  estagio: string
  valorEstimado?: string
  responsavelNome?: string
  atualizadoEm: string
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export default function CRMPage() {
  const qc = useQueryClient()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '', veiculo: '',
    origem: 'outro', valorEstimado: '', observacoes: ''
  })

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['crm-leads'],
    queryFn: () => fetch('/api/crm/leads').then(r => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }),
    onSuccess: () => {
      toast.success('Lead adicionado ao pipeline')
      qc.invalidateQueries({ queryKey: ['crm-leads'] })
      setShowModal(false)
      setForm({ nome: '', telefone: '', email: '', veiculo: '', origem: 'outro', valorEstimado: '', observacoes: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, estagio }: { id: string; estagio: string }) =>
      fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estagio }) })
        .then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  })

  async function sendChat(msg: string) {
    if (!msg.trim()) return
    const userMsg: ChatMsg = { role: 'user', content: msg }
    setChatMsgs(p => [...p, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai/vendedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: msg,
          historico: chatMsgs.slice(-8),
          contextoLead: selectedLead,
        }),
      })
      const data = await res.json()
      setChatMsgs(p => [...p, { role: 'assistant', content: data.resposta || data.error }])
    } finally {
      setChatLoading(false)
    }
  }

  const leadsPorEstagio = (estagio: string) => leads.filter(l => l.estagio === estagio)
  const totalPipeline = leads.filter(l => !['ganho','perdido'].includes(l.estagio))
    .reduce((s, l) => s + parseFloat(l.valorEstimado ?? '0'), 0)

  return (
    <div className="p-4 lg:p-6 space-y-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">CRM Vendas</h1>
          <p className="text-sm mt-0.5" style={{ color: '#55556A' }}>
            Pipeline: {leads.filter(l => !['ganho','perdido'].includes(l.estagio)).length} leads · {formatCurrency(totalPipeline)} potencial
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowChat(s => !s); setSelectedLead(null) }}
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
            <Bot className="w-5 h-5" style={{ color: '#9D4EDD' }} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs px-3 py-2">
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Cards por estágio */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {ESTAGIOS.filter(e => leadsPorEstagio(e.key).length > 0 || !['ganho','perdido'].includes(e.key)).map(estagio => {
            const itens = leadsPorEstagio(estagio.key)
            return (
              <div key={estagio.key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: estagio.cor }} />
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: estagio.cor }}>
                    {estagio.label}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: '#55556A' }}>{itens.length}</span>
                </div>

                {itens.length === 0 ? (
                  <div className="py-3 px-4 rounded-2xl text-xs text-center"
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', color: '#55556A' }}>
                    Nenhum lead nesse estágio
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itens.map(lead => (
                      <div key={lead.id}
                        onClick={() => { setSelectedLead(lead); setShowChat(true) }}
                        className="relative p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                        style={glass(estagio.cor)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-black text-white truncate">{lead.nome}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: '#55556A' }}>
                              {lead.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.telefone}</span>}
                              {lead.veiculo && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{lead.veiculo}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {lead.valorEstimado && parseFloat(lead.valorEstimado) > 0 && (
                              <p className="font-black text-sm" style={{ color: '#9D4EDD' }}>
                                {formatCurrency(parseFloat(lead.valorEstimado))}
                              </p>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: estagio.cor + '20', color: estagio.cor }}>
                              {lead.origem?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Avançar estágio */}
                        {!['ganho','perdido'].includes(lead.estagio) && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {ESTAGIOS.filter(e => e.key !== lead.estagio && !['perdido'].includes(e.key)).map(e => (
                              <button key={e.key}
                                onClick={ev => { ev.stopPropagation(); moveMutation.mutate({ id: lead.id, estagio: e.key }) }}
                                className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                                style={{ background: e.cor + '15', color: e.cor, border: `1px solid ${e.cor}30` }}>
                                → {e.label.replace(' ✓','')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Chat IA Vendedor */}
      {showChat && (
        <div className="fixed bottom-24 right-4 w-80 z-50 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#12101E', border: '1px solid rgba(157,78,221,0.3)' }}>
          <div className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid rgba(157,78,221,0.15)' }}>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: '#9D4EDD' }} />
              <div>
                <p className="font-bold text-white text-sm">Agente Vendedor IA</p>
                {selectedLead && (
                  <p className="text-xs" style={{ color: '#55556A' }}>
                    Lead: {selectedLead.nome}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setShowChat(false)}>
              <X className="w-4 h-4" style={{ color: '#55556A' }} />
            </button>
          </div>

          {chatMsgs.length === 0 && (
            <div className="p-3 grid grid-cols-1 gap-2">
              {[
                '💰 Sugestão de upsell para este lead',
                '📉 Estratégia de downsell',
                '➕ Order bump para fechar agora',
                '🔀 Crosssell de serviços complementares',
              ].map(q => (
                <button key={q} onClick={() => sendChat(q)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl font-semibold transition-all"
                  style={{ background: 'rgba(157,78,221,0.08)', color: '#A0A0B8', border: '1px solid rgba(157,78,221,0.15)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="h-52 overflow-y-auto p-3 space-y-2">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-xl ${m.role === 'user' ? 'ml-6' : 'mr-6'}`}
                style={{
                  background: m.role === 'user' ? 'rgba(157,78,221,0.2)' : 'rgba(255,255,255,0.05)',
                  color: '#E0E0E8',
                }}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="mr-6 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#9D4EDD' }} />
              </div>
            )}
          </div>

          <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat(chatInput)}
              placeholder="Perguntá para o agente..."
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: '#E0E0E8' }}
            />
            <button onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" style={{ color: chatInput.trim() ? '#9D4EDD' : '#55556A' }} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Novo Lead */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="relative w-full sm:max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: '#12101E', border: '1px solid rgba(157,78,221,0.25)' }}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.5),transparent)' }} />
            <h2 className="font-black text-white mb-4">Novo Lead</h2>
            <div className="space-y-3">
              {[
                { label: 'Nome *', key: 'nome', placeholder: 'Nome do cliente' },
                { label: 'Telefone', key: 'telefone', placeholder: '(00) 00000-0000' },
                { label: 'Email', key: 'email', placeholder: 'email@exemplo.com' },
                { label: 'Veículo', key: 'veiculo', placeholder: 'Ex: Honda Civic 2020' },
                { label: 'Valor Estimado', key: 'valorEstimado', placeholder: '0,00' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#55556A' }}>{f.label}</label>
                  <input className="input w-full" placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#55556A' }}>Origem</label>
                <select className="input w-full" value={form.origem}
                  onChange={e => setForm(p => ({ ...p, origem: e.target.value }))}>
                  {ORIGENS.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#55556A' }}>Observações</label>
                <textarea className="input w-full resize-none" rows={2} value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nome || createMutation.isPending}
                className="btn-primary flex-1">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Adicionar Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
