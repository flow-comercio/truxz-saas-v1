'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Search, Loader2, Clock, User, Wrench, CalendarDays, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, minutesToHours } from '@/lib/utils'

interface Cliente { id: string; nome: string; email: string; telefone: string | null }
interface Servico { id: string; nome: string; preco: string; duracaoMinutos: number; categoria: string | null }

const HORARIOS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16, padding: '1rem', position: 'relative' as const, overflow: 'hidden' as const }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,78,221,0.35), transparent)' }

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteSelecionado, setCliente] = useState<Cliente | null>(null)
  const [servicoSelecionado, setServico] = useState<Servico | null>(null)
  const [dataSelecionada, setData] = useState(new Date().toISOString().split('T')[0])
  const [horaSelecionada, setHora] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [step, setStep] = useState<'cliente' | 'servico' | 'data' | 'confirmar'>('cliente')

  const { data: clientes = [], isLoading: carregandoClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes', buscaCliente],
    queryFn: () => fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}`).then(r => r.json()),
    enabled: buscaCliente.length >= 2,
  })

  const { data: servicos = [], isLoading: carregandoServicos } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => fetch('/api/servicos').then(r => r.json()),
    enabled: step === 'servico',
  })

  const criarMutation = useMutation({
    mutationFn: () => {
      const dataHoraInicio = new Date(`${dataSelecionada}T${horaSelecionada}:00`).toISOString()
      return fetch('/api/agendamentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: clienteSelecionado!.id, servicoId: servicoSelecionado!.id, dataHoraInicio, observacoes: observacoes || undefined }),
      }).then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Erro'); return json })
    },
    onSuccess: (data) => { toast.success('Agendamento criado!'); router.push(`/admin/agendamentos/${data.id}`) },
    onError: (e: Error) => toast.error(e.message),
  })

  const hoje = new Date().toISOString().split('T')[0]
  const STEPS = ['cliente','servico','data','confirmar']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="p-4 lg:p-6 max-w-xl" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agendamentos"
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(157,78,221,0.15)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#A0A0B8' }} />
        </Link>
        <h1 className="text-xl font-black text-white">Novo Agendamento</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'cliente', label: 'Cliente', icon: User },
          { key: 'servico', label: 'Serviço', icon: Wrench },
          { key: 'data', label: 'Data/Hora', icon: CalendarDays },
          { key: 'confirmar', label: 'Confirmar', icon: Clock },
        ].map((s, i, arr) => {
          const sIdx = STEPS.indexOf(s.key)
          const done = sIdx < stepIdx
          const active = sIdx === stepIdx
          const Icon = s.icon
          return (
            <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' : done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : done ? '#34D399' : '#55556A',
                  border: active ? 'none' : done ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: active ? '0 0 15px rgba(157,78,221,0.4)' : 'none',
                }}>
                {done ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                {s.label}
              </div>
              {i < arr.length - 1 && <div className="w-4 h-px flex-shrink-0" style={{ background: 'rgba(157,78,221,0.2)' }} />}
            </div>
          )
        })}
      </div>

      {/* STEP: Cliente */}
      {step === 'cliente' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Buscar cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#55556A' }} />
              <input className="input pl-10" placeholder="Digite nome ou telefone..."
                value={buscaCliente} onChange={e => { setBuscaCliente(e.target.value); setCliente(null) }} autoFocus />
            </div>
          </div>
          {carregandoClientes && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#9D4EDD' }} /></div>}
          {clientes.length > 0 && (
            <div className="space-y-1">
              {clientes.map(c => (
                <button key={c.id} onClick={() => { setCliente(c); setBuscaCliente(c.nome) }}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={{
                    background: clienteSelecionado?.id === c.id ? 'rgba(157,78,221,0.15)' : 'rgba(255,255,255,0.03)',
                    border: clienteSelecionado?.id === c.id ? '1.5px solid rgba(157,78,221,0.5)' : '1px solid rgba(157,78,221,0.1)',
                  }}>
                  <p className="font-bold text-white text-sm">{c.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>{c.email}{c.telefone ? ` · ${c.telefone}` : ''}</p>
                </button>
              ))}
            </div>
          )}
          {buscaCliente.length >= 2 && !carregandoClientes && clientes.length === 0 && (
            <p className="text-center text-sm py-4" style={{ color: '#55556A' }}>Nenhum cliente encontrado</p>
          )}
          {buscaCliente.length < 2 && (
            <p className="text-xs text-center pt-4" style={{ color: '#55556A' }}>Digite pelo menos 2 caracteres para buscar</p>
          )}
          <button onClick={() => setStep('servico')} disabled={!clienteSelecionado} className="btn-primary w-full mt-2">Continuar</button>
        </div>
      )}

      {/* STEP: Serviço */}
      {step === 'servico' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
            style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)' }}>
            <User className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="text-sm font-bold" style={{ color: '#C77DFF' }}>{clienteSelecionado?.nome}</span>
          </div>
          {carregandoServicos ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#9D4EDD' }} /></div>
          ) : (
            <div className="space-y-2">
              {servicos.map(s => (
                <button key={s.id} onClick={() => setServico(s)}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={{
                    background: servicoSelecionado?.id === s.id ? 'rgba(157,78,221,0.12)' : 'rgba(255,255,255,0.03)',
                    border: servicoSelecionado?.id === s.id ? '1.5px solid rgba(157,78,221,0.5)' : '1px solid rgba(157,78,221,0.1)',
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{s.nome}</p>
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#55556A' }}>
                        <Clock className="w-3 h-3" />{minutesToHours(s.duracaoMinutos)}
                        {s.categoria && ` · ${s.categoria}`}
                      </p>
                    </div>
                    <span className="font-black" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(s.preco))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('cliente')} className="btn-secondary flex-1">Voltar</button>
            <button onClick={() => setStep('data')} disabled={!servicoSelecionado} className="btn-primary flex-1">Continuar</button>
          </div>
        </div>
      )}

      {/* STEP: Data e Hora */}
      {step === 'data' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Data *</label>
            <input type="date" className="input" min={hoje} value={dataSelecionada} onChange={e => { setData(e.target.value); setHora('') }} />
          </div>
          {dataSelecionada && (
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Horário *</label>
              <div className="grid grid-cols-4 gap-2">
                {HORARIOS.map(h => (
                  <button key={h} onClick={() => setHora(h)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: horaSelecionada === h ? 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' : 'rgba(255,255,255,0.04)',
                      border: horaSelecionada === h ? 'none' : '1px solid rgba(157,78,221,0.15)',
                      color: horaSelecionada === h ? '#fff' : '#A0A0B8',
                      boxShadow: horaSelecionada === h ? '0 0 12px rgba(157,78,221,0.4)' : 'none',
                    }}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#55556A' }}>Observações (opcional)</label>
            <textarea className="input" rows={2} placeholder="Instruções especiais..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('servico')} className="btn-secondary flex-1">Voltar</button>
            <button onClick={() => setStep('confirmar')} disabled={!dataSelecionada || !horaSelecionada} className="btn-primary flex-1">Continuar</button>
          </div>
        </div>
      )}

      {/* STEP: Confirmar */}
      {step === 'confirmar' && clienteSelecionado && servicoSelecionado && (
        <div className="space-y-4">
          <div style={card}>
            <div style={shimmer} />
            <h3 className="font-black text-white mb-4">Resumo do Agendamento</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Cliente', value: clienteSelecionado.nome },
                { label: 'Serviço', value: servicoSelecionado.nome },
                { label: 'Data', value: new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) },
                { label: 'Horário', value: horaSelecionada },
                { label: 'Duração', value: minutesToHours(servicoSelecionado.duracaoMinutos) },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span style={{ color: '#55556A' }}>{row.label}</span>
                  <span className="font-bold text-white">{row.value}</span>
                </div>
              ))}
              {observacoes && (
                <div className="flex justify-between">
                  <span style={{ color: '#55556A' }}>Obs.</span>
                  <span className="font-medium text-right max-w-[60%]" style={{ color: '#A0A0B8' }}>{observacoes}</span>
                </div>
              )}
              <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
                <span className="font-black text-white">Valor Total</span>
                <span className="font-black text-lg" style={{ color: '#C77DFF' }}>{formatCurrency(parseFloat(servicoSelecionado.preco))}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('data')} className="btn-secondary flex-1">Voltar</button>
            <button onClick={() => criarMutation.mutate()} disabled={criarMutation.isPending} className="btn-primary flex-1">
              {criarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {criarMutation.isPending ? 'Criando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
