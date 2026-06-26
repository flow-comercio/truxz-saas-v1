'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, Loader2, Clock, CheckCircle, Calendar, Wrench, Tag } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'

interface Servico {
  id: string; nome: string; descricao: string | null
  preco: string; duracaoMinutos: number; categoria: string | null
}

const HORARIOS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00']
type Step = 'servico' | 'data' | 'confirmacao'
const STEPS: { key: Step; label: string }[] = [
  { key: 'servico',     label: 'Serviço' },
  { key: 'data',        label: 'Data e Hora' },
  { key: 'confirmacao', label: 'Confirmar' },
]

export default function AgendarPage() {
  const router = useRouter()
  const [step, setStep]       = useState<Step>('servico')
  const [servico, setServico] = useState<Servico | null>(null)
  const [data, setData]       = useState('')
  const [hora, setHora]       = useState('')

  const { data: servicos = [], isLoading } = useQuery<Servico[]>({
    queryKey: ['servicos-cliente'],
    queryFn:  () => fetch('/api/servicos').then(r => r.json()),
  })

  const agendarMutation = useMutation({
    mutationFn: async () => {
      const dataHoraInicio = new Date(`${data}T${hora}:00`).toISOString()
      const res = await fetch('/api/agendamentos/cliente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId: servico!.id, dataHoraInicio }),
      })
      if (!res.ok) throw new Error('Erro ao agendar')
      return res.json()
    },
    onSuccess: () => { toast.success('Agendamento realizado!'); router.push('/cliente') },
    onError:   () => toast.error('Erro ao agendar. Tente outro horário.'),
  })

  const hoje    = new Date().toISOString().split('T')[0]
  const stepIdx = STEPS.findIndex(s => s.key === step)

  const categorias = servicos.reduce<Record<string, Servico[]>>((acc, s) => {
    const cat = s.categoria ?? 'Serviços'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER + PROGRESS ──────────────────────── */}
      <div className="sticky top-0 z-20 safe-top glass-strong"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronRight className="w-4 h-4 text-white/50 rotate-180" />
          </button>
          <h1 className="font-black text-white">Novo Agendamento</h1>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done   = i < stepIdx
              const active = i === stepIdx
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                      style={{
                        background: done ? 'rgba(52,199,89,0.15)' : active ? 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' : 'rgba(255,255,255,0.05)',
                        border:     done ? '1px solid rgba(52,199,89,0.4)' : active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow:  active ? '0 0 12px rgba(157,78,221,0.5)' : 'none',
                        color:      done ? '#34C759' : active ? '#fff' : '#55556A',
                      }}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className="text-[10px] font-black whitespace-nowrap"
                      style={{ color: active ? '#C77DFF' : done ? '#34C759' : '#55556A' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2 -mt-4"
                      style={{ background: done ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.06)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* ── STEP 1: SERVIÇO ────────────────────────── */}
        {step === 'servico' && (
          isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
            </div>
          ) : Object.entries(categorias).map(([cat, svcs]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Tag className="w-3 h-3 text-white/20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{cat}</p>
              </div>
              <div className="space-y-2">
                {svcs.map(s => (
                  <button key={s.id} onClick={() => { setServico(s); setStep('data') }}
                    className="w-full text-left card p-4 active:scale-[0.98] transition-all"
                    style={servico?.id === s.id ? {
                      background: 'rgba(157,78,221,0.12)', borderColor: 'rgba(157,78,221,0.5)',
                    } : undefined}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(157,78,221,0.12)', border: '1px solid rgba(157,78,221,0.2)' }}>
                        <Wrench className="w-5 h-5 text-[#9D4EDD]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm">{s.nome}</p>
                        {s.descricao && (
                          <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{s.descricao}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-white/25" />
                          <span className="text-xs text-white/35">{minutesToHours(s.duracaoMinutos)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-[#C77DFF]">{formatCurrency(parseFloat(s.preco))}</span>
                        <ChevronRight className="w-4 h-4 text-white/20 mt-1 ml-auto" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}

        {/* ── STEP 2: DATA E HORA ────────────────────── */}
        {step === 'data' && servico && (
          <div className="space-y-4">
            <div className="card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(157,78,221,0.12)' }}>
                <Wrench className="w-4 h-4 text-[#9D4EDD]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm truncate">{servico.nome}</p>
                <p className="text-xs text-white/35">
                  {minutesToHours(servico.duracaoMinutos)} · {formatCurrency(parseFloat(servico.preco))}
                </p>
              </div>
              <button onClick={() => { setServico(null); setStep('servico') }}
                className="text-xs font-bold text-[#9D4EDD] flex-shrink-0">
                Trocar
              </button>
            </div>

            <div>
              <label className="label flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5" /> Data
              </label>
              <input type="date" className="input" min={hoje} value={data}
                onChange={e => { setData(e.target.value); setHora('') }} />
            </div>

            {data && (
              <div>
                <label className="label mb-2">Horário disponível</label>
                <div className="grid grid-cols-3 gap-2">
                  {HORARIOS.map(h => (
                    <button key={h} onClick={() => setHora(h)}
                      className="py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                      style={{
                        background: hora === h ? 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' : 'rgba(255,255,255,0.04)',
                        border:     hora === h ? 'none' : '1px solid rgba(157,78,221,0.15)',
                        color:      hora === h ? '#fff' : '#A0A0B8',
                        boxShadow:  hora === h ? '0 0 14px rgba(157,78,221,0.4)' : 'none',
                      }}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('servico')} className="btn-secondary flex-1">Voltar</button>
              <button onClick={() => setStep('confirmacao')}
                disabled={!data || !hora} className="btn-primary flex-1">
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRMAÇÃO ────────────────────── */}
        {step === 'confirmacao' && servico && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle className="w-4 h-4 text-[#34C759]" />
                <span className="text-xs font-black uppercase tracking-widest text-white/35">Resumo</span>
              </div>

              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', boxShadow: '0 0 30px rgba(157,78,221,0.4)' }}>
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <p className="font-black text-white text-lg">{servico.nome}</p>
                <p className="text-2xl font-black text-[#C77DFF] mt-1">
                  {formatCurrency(parseFloat(servico.preco))}
                </p>
              </div>

              <div className="space-y-3 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  {
                    label: 'Data',
                    value: new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    }),
                  },
                  { label: 'Horário', value: hora },
                  { label: 'Duração', value: minutesToHours(servico.duracaoMinutos) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm text-white/35">{row.label}</span>
                    <span className="text-sm font-bold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('data')} className="btn-secondary flex-1">Voltar</button>
              <button onClick={() => agendarMutation.mutate()}
                disabled={agendarMutation.isPending} className="btn-primary flex-1" style={{ height: 52 }}>
                {agendarMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Agendando...</>
                  : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
