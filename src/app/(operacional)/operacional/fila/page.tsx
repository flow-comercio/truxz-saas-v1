'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Car, Clock, User, Play, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Agendamento {
  id: string
  status: string
  dataHoraInicio: string
  precoTotal: string
  clienteNome: string
  clienteTelefone: string
  servicoNome: string
  servicoDuracao: number
}

const STATUS_CONFIG = {
  pendente:     { label: 'Pendente',     color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50' },
  confirmado:   { label: 'Confirmado',   color: 'bg-blue-500',  textColor: 'text-blue-700',  bg: 'bg-blue-50' },
  em_andamento: { label: 'Em Andamento', color: 'bg-orange-500',textColor: 'text-orange-700',bg: 'bg-orange-50' },
  concluido:    { label: 'Concluído',    color: 'bg-emerald-500',textColor: 'text-emerald-700',bg: 'bg-emerald-50' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-500',   textColor: 'text-red-700',   bg: 'bg-red-50' },
}

export default function FilaPage() {
  const qc = useQueryClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { data: agendamentos = [], isLoading, refetch } = useQuery<Agendamento[]>({
    queryKey: ['fila', hoje],
    queryFn: () => fetch(`/api/agendamentos?data=${hoje}`).then(r => r.json()),
    refetchInterval: 30000, // auto-refresh a cada 30s
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success('Status atualizado!')
      qc.invalidateQueries({ queryKey: ['fila'] })
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const ativos = agendamentos.filter(a => !['concluido', 'cancelado'].includes(a.status))
  const finalizados = agendamentos.filter(a => ['concluido', 'cancelado'].includes(a.status))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Fila de Atendimento</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Contador */}
      <div className="bg-orange-600 px-4 py-3">
        <div className="flex items-center justify-between text-white">
          <span className="text-sm font-medium opacity-90">Aguardando hoje</span>
          <span className="text-2xl font-bold">{ativos.length}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        ) : ativos.length === 0 && finalizados.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum agendamento hoje</p>
          </div>
        ) : (
          <>
            {ativos.map(ag => {
              const cfg = STATUS_CONFIG[ag.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente
              const hora = new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              const pending = updateStatus.isPending

              return (
                <div key={ag.id} className={cn('rounded-2xl border-2 p-4', cfg.bg, 'border-transparent')}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', cfg.color)} />
                      <span className={cn('text-xs font-semibold', cfg.textColor)}>{cfg.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{hora}</span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-900 text-sm">{ag.clienteNome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700">{ag.servicoNome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">{minutesToHours(ag.servicoDuracao)} · {formatCurrency(parseFloat(ag.precoTotal))}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {ag.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateStatus.mutate({ id: ag.id, status: 'em_andamento' })}
                          disabled={pending}
                          className="flex-1 btn-primary text-xs py-2"
                        >
                          <Play className="w-3.5 h-3.5" /> Iniciar
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: ag.id, status: 'cancelado' })}
                          disabled={pending}
                          className="btn-secondary text-xs py-2 px-3"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </>
                    )}
                    {ag.status === 'confirmado' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'em_andamento' })}
                        disabled={pending}
                        className="flex-1 btn-primary text-xs py-2"
                      >
                        <Play className="w-3.5 h-3.5" /> Iniciar Serviço
                      </button>
                    )}
                    {ag.status === 'em_andamento' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: ag.id, status: 'concluido' })}
                        disabled={pending}
                        className="flex-1 btn-primary text-xs py-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Concluir
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Finalizados */}
            {finalizados.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Finalizados</p>
                {finalizados.map(ag => {
                  const cfg = STATUS_CONFIG[ag.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.concluido
                  const hora = new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={ag.id} className="card !p-3 opacity-60 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{ag.clienteNome}</p>
                          <p className="text-xs text-gray-400">{ag.servicoNome} · {hora}</p>
                        </div>
                        <span className={cn('text-xs font-semibold', cfg.textColor)}>{cfg.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
