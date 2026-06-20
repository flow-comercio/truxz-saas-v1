'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Search, Loader2, Clock, User, Wrench, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Cliente { id: string; nome: string; email: string; telefone: string | null }
interface Servico { id: string; nome: string; preco: string; duracaoMinutos: number; categoria: string | null }

const HORARIOS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteSelecionado, setCliente] = useState<Cliente | null>(null)
  const [servicoSelecionado, setServico] = useState<Servico | null>(null)
  const [dataSelecionada, setData] = useState(new Date().toISOString().split('T')[0])
  const [horaSelecionada, setHora] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [step, setStep] = useState<'cliente' | 'servico' | 'data' | 'confirmar'>('cliente')

  // Busca clientes
  const { data: clientes = [], isLoading: carregandoClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes', buscaCliente],
    queryFn: () => fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}`).then(r => r.json()),
    enabled: buscaCliente.length >= 2,
  })

  // Busca serviços
  const { data: servicos = [], isLoading: carregandoServicos } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => fetch('/api/servicos').then(r => r.json()),
    enabled: step === 'servico',
  })

  const criarMutation = useMutation({
    mutationFn: () => {
      const dataHoraInicio = new Date(`${dataSelecionada}T${horaSelecionada}:00`).toISOString()
      return fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSelecionado!.id,
          servicoId: servicoSelecionado!.id,
          dataHoraInicio,
          observacoes: observacoes || undefined,
        }),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro ao criar agendamento')
        return json
      })
    },
    onSuccess: (data) => {
      toast.success('Agendamento criado com sucesso!')
      router.push(`/admin/agendamentos/${data.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agendamentos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Novo Agendamento</h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'cliente',  label: 'Cliente',   icon: User },
          { key: 'servico',  label: 'Serviço',   icon: Wrench },
          { key: 'data',     label: 'Data/Hora', icon: CalendarDays },
          { key: 'confirmar',label: 'Confirmar', icon: Clock },
        ].map((s, i, arr) => {
          const steps = ['cliente','servico','data','confirmar']
          const idx = steps.indexOf(step)
          const sIdx = steps.indexOf(s.key)
          const done = sIdx < idx
          const active = sIdx === idx
          const Icon = s.icon
          return (
            <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                active  ? 'bg-orange-600 text-white' :
                done    ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-400'
              )}>
                <Icon className="w-3 h-3" />
                {s.label}
              </div>
              {i < arr.length - 1 && <div className="w-4 h-px bg-gray-200 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* STEP: Cliente */}
      {step === 'cliente' && (
        <div className="space-y-4">
          <div>
            <label className="label">Buscar cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-10"
                placeholder="Digite nome ou telefone..."
                value={buscaCliente}
                onChange={e => { setBuscaCliente(e.target.value); setCliente(null) }}
                autoFocus
              />
            </div>
          </div>

          {carregandoClientes && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
            </div>
          )}

          {clientes.length > 0 && (
            <div className="space-y-1">
              {clientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setCliente(c); setBuscaCliente(c.nome) }}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition-all',
                    clienteSelecionado?.id === c.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-transparent bg-gray-50 hover:bg-orange-50 hover:border-orange-200'
                  )}
                >
                  <p className="font-semibold text-gray-900 text-sm">{c.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.email}{c.telefone ? ` · ${c.telefone}` : ''}</p>
                </button>
              ))}
            </div>
          )}

          {buscaCliente.length >= 2 && !carregandoClientes && clientes.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
              <Link href="/admin/agendamentos" className="text-orange-600 text-xs font-medium mt-1 block">
                Cadastrar novo cliente primeiro
              </Link>
            </div>
          )}

          {buscaCliente.length < 2 && (
            <p className="text-xs text-gray-400 text-center pt-4">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={() => setStep('servico')}
              disabled={!clienteSelecionado}
              className="btn-primary w-full"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP: Serviço */}
      {step === 'servico' && (
        <div className="space-y-3">
          <div className="card !p-3 bg-orange-50 border-orange-100 flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">{clienteSelecionado?.nome}</span>
          </div>

          {carregandoServicos ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-orange-600 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {servicos.map(s => (
                <button
                  key={s.id}
                  onClick={() => setServico(s)}
                  className={cn(
                    'w-full text-left card !p-4 border-2 transition-all hover:shadow-md',
                    servicoSelecionado?.id === s.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-transparent hover:border-orange-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{minutesToHours(s.duracaoMinutos)}
                        {s.categoria && ` · ${s.categoria}`}
                      </p>
                    </div>
                    <span className="font-bold text-orange-600">{formatCurrency(parseFloat(s.preco))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('cliente')} className="btn-secondary flex-1">Voltar</button>
            <button onClick={() => setStep('data')} disabled={!servicoSelecionado} className="btn-primary flex-1">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP: Data e Hora */}
      {step === 'data' && (
        <div className="space-y-5">
          <div>
            <label className="label">Data *</label>
            <input
              type="date"
              className="input"
              min={hoje}
              value={dataSelecionada}
              onChange={e => { setData(e.target.value); setHora('') }}
            />
          </div>

          {dataSelecionada && (
            <div>
              <label className="label">Horário *</label>
              <div className="grid grid-cols-4 gap-2">
                {HORARIOS.map(h => (
                  <button
                    key={h}
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

          <div>
            <label className="label">Observações (opcional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Instruções especiais, pedidos do cliente..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('servico')} className="btn-secondary flex-1">Voltar</button>
            <button
              onClick={() => setStep('confirmar')}
              disabled={!dataSelecionada || !horaSelecionada}
              className="btn-primary flex-1"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP: Confirmar */}
      {step === 'confirmar' && clienteSelecionado && servicoSelecionado && (
        <div className="space-y-4">
          <div className="card border-2 border-orange-100">
            <h3 className="font-bold text-gray-900 mb-4">Resumo do Agendamento</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente</span>
                <span className="font-semibold text-gray-900">{clienteSelecionado.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Serviço</span>
                <span className="font-semibold text-gray-900">{servicoSelecionado.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Data</span>
                <span className="font-semibold text-gray-900">
                  {new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'short', day: 'numeric', month: 'short'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horário</span>
                <span className="font-semibold text-gray-900">{horaSelecionada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duração</span>
                <span className="font-semibold text-gray-900">{minutesToHours(servicoSelecionado.duracaoMinutos)}</span>
              </div>
              {observacoes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Obs.</span>
                  <span className="font-medium text-gray-700 text-right max-w-[60%]">{observacoes}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Valor Total</span>
                <span className="font-bold text-orange-600 text-lg">
                  {formatCurrency(parseFloat(servicoSelecionado.preco))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('data')} className="btn-secondary flex-1">Voltar</button>
            <button
              onClick={() => criarMutation.mutate()}
              disabled={criarMutation.isPending}
              className="btn-primary flex-1"
            >
              {criarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {criarMutation.isPending ? 'Criando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
