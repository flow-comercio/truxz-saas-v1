'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Car, Clock, User, CheckCircle, XCircle, Loader2, RefreshCw, Play } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Gauge } from '@/components/ui/gauge'
import { SwipeCard } from '@/components/ui/swipe-card'

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

const STATUS_CFG: Record<string, { label: string; variant: 'amber' | 'purple' | 'blue' | 'green' | 'red' | 'neutral' }> = {
  pendente:     { label: 'Pendente',     variant: 'amber' },
  confirmado:   { label: 'Confirmado',   variant: 'purple' },
  em_andamento: { label: 'Em Serviço',   variant: 'blue' },
  concluido:    { label: 'Concluído',    variant: 'green' },
  cancelado:    { label: 'Cancelado',    variant: 'red' },
}

export default function FilaPage() {
  const qc   = useQueryClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { data: agendamentos = [], isLoading, refetch } = useQuery<Agendamento[]>({
    queryKey: ['fila', hoje],
    queryFn:  () => fetch(`/api/agendamentos?data=${hoje}`).then(r => r.json()),
    refetchInterval: 30000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/agendamentos/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success('Status atualizado!')
      qc.invalidateQueries({ queryKey: ['fila'] })
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const ativos      = agendamentos.filter(a => !['concluido', 'cancelado'].includes(a.status))
  const emServico   = agendamentos.filter(a => a.status === 'em_andamento').length
  const finalizados = agendamentos.filter(a => ['concluido', 'cancelado'].includes(a.status))
  const pending     = updateStatus.isPending

  const action = (id: string, status: string) => updateStatus.mutate({ id, status })

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 safe-top px-4 py-3 flex items-center justify-between glass-strong"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <div>
          <h1 className="font-black text-white text-base">Fila de Atendimento</h1>
          <p className="text-xs text-white/35 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.2)' }}>
          <RefreshCw className="w-4 h-4 text-[#9D4EDD]" />
        </button>
      </div>

      {/* ── GAUGE TOPO ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-8 px-4 pt-6 pb-4">
        <Gauge
          value={ativos.length}
          max={Math.max(ativos.length, 10)}
          size={130}
          unit="ativos"
          sub="na fila"
          color="purple"
        />
        <Gauge
          value={emServico}
          max={Math.max(ativos.length, 5)}
          size={100}
          unit="em serv."
          color="blue"
        />
      </div>

      {/* Legenda hint */}
      {ativos.length > 0 && (
        <p className="text-center text-[10px] text-white/25 font-bold uppercase tracking-widest pb-2">
          ← deslize para cancelar · concluir →
        </p>
      )}

      <div className="px-4 space-y-3 pb-28">

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
          </div>
        ) : ativos.length === 0 && finalizados.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Car className="w-8 h-8 text-white/20" />
            </div>
            <p className="font-bold text-white/40">Nenhum agendamento hoje</p>
            <p className="text-xs text-white/20 mt-1">A fila está vazia</p>
          </div>
        ) : (
          <>
            {/* Ativos com SwipeCard */}
            {ativos.map(ag => {
              const cfg  = STATUS_CFG[ag.status] ?? STATUS_CFG.pendente
              const hora = new Date(ag.dataHoraInicio)
                .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

              const isEmAndamento = ag.status === 'em_andamento'
              const isPendente    = ag.status === 'pendente'
              const isConfirmado  = ag.status === 'confirmado'

              const bgBorder = isEmAndamento
                ? { bg: 'rgba(63,142,255,0.08)', border: 'rgba(63,142,255,0.35)' }
                : isPendente
                  ? { bg: 'rgba(251,191,36,0.05)', border: 'rgba(251,191,36,0.25)' }
                  : { bg: 'rgba(157,78,221,0.06)', border: 'rgba(157,78,221,0.25)' }

              return (
                <SwipeCard
                  key={ag.id}
                  onSwipeRight={
                    isEmAndamento
                      ? () => action(ag.id, 'concluido')
                      : (isPendente || isConfirmado)
                        ? () => action(ag.id, 'em_andamento')
                        : undefined
                  }
                  onSwipeLeft={
                    (isPendente || isConfirmado)
                      ? () => action(ag.id, 'cancelado')
                      : undefined
                  }
                  rightLabel={isEmAndamento ? 'Concluir' : 'Iniciar'}
                  leftLabel="Cancelar"
                >
                  <div className="p-4 rounded-[20px]"
                    style={{ background: bgBorder.bg, border: `1.5px solid ${bgBorder.border}` }}>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                      <span className="font-black text-white tabular-nums">{hora}</span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        <span className="font-bold text-white text-sm">{ag.clienteNome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        <span className="text-sm text-white/60">{ag.servicoNome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        <span className="text-xs text-white/35">
                          {minutesToHours(ag.servicoDuracao)} · {formatCurrency(parseFloat(ag.precoTotal))}
                        </span>
                      </div>
                    </div>

                    {/* Botões de ação (fallback ao swipe) */}
                    <div className="flex gap-2">
                      {(isPendente || isConfirmado) && (
                        <>
                          <button
                            onClick={() => action(ag.id, 'em_andamento')}
                            disabled={pending}
                            className="btn-primary flex-1 text-xs"
                            style={{ height: 40 }}>
                            <Play className="w-3.5 h-3.5" /> Iniciar
                          </button>
                          <button
                            onClick={() => action(ag.id, 'cancelado')}
                            disabled={pending}
                            className="btn-danger text-xs px-3"
                            style={{ height: 40 }}>
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {isEmAndamento && (
                        <button
                          onClick={() => action(ag.id, 'concluido')}
                          disabled={pending}
                          className="flex-1 text-xs rounded-xl font-black flex items-center justify-center gap-1.5 text-white transition-all active:scale-95"
                          style={{
                            height: 40,
                            background: 'linear-gradient(135deg, #34C759, #16a34a)',
                            boxShadow: '0 0 20px rgba(52,199,89,0.3)',
                          }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Concluir
                        </button>
                      )}
                    </div>
                  </div>
                </SwipeCard>
              )
            })}

            {/* Finalizados */}
            {finalizados.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 pl-1">
                  Finalizados
                </p>
                {finalizados.map(ag => {
                  const cfg  = STATUS_CFG[ag.status] ?? STATUS_CFG.concluido
                  const hora = new Date(ag.dataHoraInicio)
                    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={ag.id} className="p-3 rounded-2xl mb-2 opacity-40"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white/70">{ag.clienteNome}</p>
                          <p className="text-xs text-white/35">{ag.servicoNome} · {hora}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
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
