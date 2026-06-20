'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Clock, CheckCircle, Loader2, Camera, Timer,
  User, Car, DollarSign, MessageSquare
} from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'

interface AgEmAndamento {
  id: string
  clienteNome: string
  clienteTelefone: string
  servicoNome: string
  servicoDuracao: number
  dataHoraInicio: string
  precoTotal: string
  observacoes: string | null
  veiculoPlaca: string | null
  veiculoModelo: string | null
  veiculoCor: string | null
}

function Cronometro({ inicio }: { inicio: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = new Date(inicio).getTime()
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [inicio])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const fmt = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="font-mono text-3xl font-bold text-orange-600 tabular-nums">
      {h > 0 ? `${fmt(h)}:` : ''}{fmt(m)}:{fmt(s)}
    </span>
  )
}

export default function ServicoEmAndamentoPage() {
  const qc = useQueryClient()
  const [obs, setObs] = useState('')
  const [showObs, setShowObs] = useState(false)

  const { data: agendamentos = [], isLoading } = useQuery<AgEmAndamento[]>({
    queryKey: ['em-andamento'],
    queryFn: () =>
      fetch('/api/agendamentos?status=em_andamento&data=' + new Date().toISOString().split('T')[0])
        .then(r => r.json()),
    refetchInterval: 15000,
  })

  const concluirMutation = useMutation({
    mutationFn: ({ id, observacoesInternas }: { id: string; observacoesInternas?: string }) =>
      fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluido', observacoesInternas }),
      }),
    onSuccess: () => {
      toast.success('Serviço concluído! 🎉')
      qc.invalidateQueries({ queryKey: ['em-andamento'] })
      qc.invalidateQueries({ queryKey: ['fila'] })
      setObs('')
      setShowObs(false)
    },
    onError: () => toast.error('Erro ao concluir serviço'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-bold text-gray-900">Em Serviço</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {agendamentos.length} serviço(s) em andamento
        </p>
      </div>

      {agendamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <Car className="w-10 h-10 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">Nenhum serviço em andamento</p>
          <p className="text-sm text-gray-400">
            Inicie um atendimento pela fila para ele aparecer aqui
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {agendamentos.map(ag => (
            <div key={ag.id} className="card border-2 border-orange-200 space-y-4">
              {/* Cronômetro */}
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                    Tempo em serviço
                  </span>
                </div>
                <Cronometro inicio={ag.dataHoraInicio} />
                <p className="text-xs text-orange-400 mt-1">
                  Previsto: {minutesToHours(ag.servicoDuracao)}
                </p>
              </div>

              {/* Info do cliente */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{ag.clienteNome}</p>
                    <p className="text-xs text-gray-500">{ag.clienteTelefone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ag.servicoNome}</p>
                    {ag.veiculoPlaca && (
                      <p className="text-xs text-gray-500">
                        {ag.veiculoPlaca}
                        {ag.veiculoModelo ? ` · ${ag.veiculoModelo}` : ''}
                        {ag.veiculoCor ? ` · ${ag.veiculoCor}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-bold text-orange-600">
                    {formatCurrency(parseFloat(ag.precoTotal))}
                  </p>
                </div>

                {ag.observacoes && (
                  <div className="bg-amber-50 rounded-lg p-2.5 text-xs text-amber-800">
                    <span className="font-semibold">Obs do cliente: </span>
                    {ag.observacoes}
                  </div>
                )}
              </div>

              {/* Observações internas */}
              <div>
                <button
                  onClick={() => setShowObs(!showObs)}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {showObs ? 'Ocultar observações' : 'Adicionar observação interna'}
                </button>
                {showObs && (
                  <textarea
                    className="input mt-2 text-xs"
                    rows={2}
                    placeholder="Observações internas (não visível ao cliente)..."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                  />
                )}
              </div>

              {/* Ações */}
              <button
                onClick={() => concluirMutation.mutate({ id: ag.id, observacoesInternas: obs || undefined })}
                disabled={concluirMutation.isPending}
                className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {concluirMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                {concluirMutation.isPending ? 'Concluindo...' : 'Marcar como Concluído'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
