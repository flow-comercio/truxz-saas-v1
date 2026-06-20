'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, Loader2, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Servico { id: string; nome: string; descricao: string | null; preco: string; duracaoMinutos: number; categoria: string | null }

const HORARIOS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00']

type Step = 'servico' | 'data' | 'confirmacao'

export default function AgendarPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('servico')
  const [servicoSelecionado, setServico] = useState<Servico | null>(null)
  const [dataSelecionada, setData] = useState('')
  const [horaSelecionada, setHora] = useState('')

  const { data: servicos = [], isLoading } = useQuery<Servico[]>({
    queryKey: ['servicos-cliente'],
    queryFn: () => fetch('/api/servicos').then(r => r.json()),
  })

  const agendarMutation = useMutation({
    mutationFn: async () => {
      const dataHoraInicio = new Date(`${dataSelecionada}T${horaSelecionada}:00`).toISOString()
      const res = await fetch('/api/agendamentos/cliente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId: servicoSelecionado!.id, dataHoraInicio }),
      })
      if (!res.ok) throw new Error('Erro ao agendar')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Agendamento realizado com sucesso!')
      router.push('/cliente')
    },
    onError: () => toast.error('Erro ao realizar agendamento. Tente outro horário.'),
  })

  const hoje = new Date().toISOString().split('T')[0]

  // Group services by category
  const categorias = servicos.reduce<Record<string, Servico[]>>((acc, s) => {
    const cat = s.categoria ?? 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const STEPS = ['servico', 'data', 'confirmacao']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-bold text-gray-900">Novo Agendamento</h1>
        {/* Progress */}
        <div className="flex items-center gap-2 mt-3">
          {['Serviço', 'Data e Hora', 'Confirmar'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i < stepIdx ? 'bg-emerald-500 text-white' :
                i === stepIdx ? 'bg-orange-600 text-white' :
                'bg-gray-100 text-gray-400'
              )}>
                {i < stepIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', i === stepIdx ? 'text-orange-600' : 'text-gray-400')}>
                {label}
              </span>
              {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* STEP 1: Escolha de serviço */}
        {step === 'servico' && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-600 animate-spin" /></div>
            ) : (
              Object.entries(categorias).map(([cat, svcs]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-2">
                    {svcs.map(s => (
                      <button key={s.id} onClick={() => { setServico(s); setStep('data') }}
                        className={cn(
                          'w-full text-left card !p-4 hover:border-orange-300 hover:shadow-md transition-all',
                          servicoSelecionado?.id === s.id ? 'border-orange-500 bg-orange-50' : ''
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{s.nome}</p>
                            {s.descricao && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.descricao}</p>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{minutesToHours(s.duracaoMinutos)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <span className="font-bold text-orange-600">{formatCurrency(parseFloat(s.preco))}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* STEP 2: Data e hora */}
        {step === 'data' && (
          <div className="space-y-5">
            <div>
              <label className="label">Escolha a data</label>
              <input type="date" className="input" min={hoje}
                value={dataSelecionada}
                onChange={e => { setData(e.target.value); setHora('') }} />
            </div>

            {dataSelecionada && (
              <div>
                <label className="label">Escolha o horário</label>
                <div className="grid grid-cols-3 gap-2">
                  {HORARIOS.map(h => (
                    <button key={h}
                      onClick={() => setHora(h)}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
                        horaSelecionada === h
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('servico')} className="btn-secondary flex-1">Voltar</button>
              <button
                onClick={() => setStep('confirmacao')}
                disabled={!dataSelecionada || !horaSelecionada}
                className="btn-primary flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmação */}
        {step === 'confirmacao' && servicoSelecionado && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Resumo do Agendamento</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Serviço</span>
                  <span className="font-medium text-gray-900">{servicoSelecionado.nome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data</span>
                  <span className="font-medium text-gray-900">
                    {new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horário</span>
                  <span className="font-medium text-gray-900">{horaSelecionada}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duração</span>
                  <span className="font-medium text-gray-900">{minutesToHours(servicoSelecionado.duracaoMinutos)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {formatCurrency(parseFloat(servicoSelecionado.preco))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('data')} className="btn-secondary flex-1">Voltar</button>
              <button
                onClick={() => agendarMutation.mutate()}
                disabled={agendarMutation.isPending}
                className="btn-primary flex-1"
              >
                {agendarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {agendarMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
