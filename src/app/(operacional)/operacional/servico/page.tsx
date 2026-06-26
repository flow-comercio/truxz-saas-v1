'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Loader2, User, Car, DollarSign, MessageSquare, Timer, AlertCircle } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import { Gauge } from '@/components/ui/gauge'

interface AgEmAndamento {
  id: string; clienteNome: string; clienteTelefone: string
  servicoNome: string; servicoDuracao: number; dataHoraInicio: string
  precoTotal: string; observacoes: string | null
  veiculoPlaca: string | null; veiculoModelo: string | null; veiculoCor: string | null
}

function useCronometro(inicio: string, duracaoMin: number) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start  = new Date(inicio).getTime()
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [inicio])

  const h   = Math.floor(elapsed / 3600)
  const m   = Math.floor((elapsed % 3600) / 60)
  const s   = elapsed % 60
  const fmt = (n: number) => String(n).padStart(2, '0')
  const str = h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`

  const totalSeg   = duracaoMin * 60
  const pct        = Math.min(100, Math.round((elapsed / totalSeg) * 100))
  const atrasado   = elapsed > totalSeg

  return { str, pct, atrasado, elapsedMin: Math.floor(elapsed / 60) }
}

function ServicoCard({ ag, onConcluir }: { ag: AgEmAndamento; onConcluir: (id: string, obs?: string) => void }) {
  const [showObs, setShowObs] = useState(false)
  const [obs, setObs]         = useState('')
  const { str, pct, atrasado, elapsedMin } = useCronometro(ag.dataHoraInicio, ag.servicoDuracao)

  const gaugeColor = atrasado ? 'pink' : pct > 75 ? 'blue' : 'purple'

  return (
    <div className="card overflow-hidden">
      {/* ── CRONÔMETRO ─────────────────────────────── */}
      <div className="p-5 text-center"
        style={{
          background: atrasado ? 'rgba(255,55,95,0.06)' : 'rgba(157,78,221,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-[#9D4EDD]" />
          <span className="text-xs font-black uppercase tracking-widest text-white/35">
            Tempo em serviço
          </span>
          {atrasado && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.3)' }}>
              <AlertCircle className="w-3 h-3 text-[#FF375F]" />
              <span className="text-[10px] font-black text-[#FF375F]">Atrasado</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8">
          <Gauge
            value={pct}
            max={100}
            size={120}
            unit="%"
            sub={atrasado ? 'tempo extra' : 'concluído'}
            color={gaugeColor}
          />
          <div className="text-left">
            <p className="font-mono text-4xl font-black tabular-nums"
              style={{ color: atrasado ? '#FF375F' : '#C77DFF' }}>
              {str}
            </p>
            <p className="text-xs text-white/35 mt-1">
              Previsto: {minutesToHours(ag.servicoDuracao)}
            </p>
            {atrasado && (
              <p className="text-xs text-[#FF375F] font-bold mt-0.5">
                +{elapsedMin - ag.servicoDuracao}min extra
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── INFO ────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {[
          { Icon: User,        color: '#9D4EDD', title: ag.clienteNome, sub: ag.clienteTelefone },
          {
            Icon: Car, color: '#3F8EFF', title: ag.servicoNome,
            sub: [ag.veiculoPlaca, ag.veiculoModelo, ag.veiculoCor].filter(Boolean).join(' · ') || undefined,
          },
          { Icon: DollarSign,  color: '#34C759', title: formatCurrency(parseFloat(ag.precoTotal)), sub: undefined },
        ].map(({ Icon, color, title, sub }, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{title}</p>
              {sub && <p className="text-xs text-white/35 mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}

        {/* Obs cliente */}
        {ag.observacoes && (
          <div className="p-3 rounded-xl text-xs"
            style={{ background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.2)', color: '#FCD34D' }}>
            <span className="font-black">Obs do cliente: </span>{ag.observacoes}
          </div>
        )}

        {/* Obs interna */}
        <div>
          <button onClick={() => setShowObs(!showObs)}
            className="flex items-center gap-2 text-xs font-bold text-white/25 hover:text-[#9D4EDD] transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            {showObs ? 'Ocultar' : 'Adicionar observação interna'}
          </button>
          {showObs && (
            <textarea className="input mt-2 text-xs" rows={2}
              placeholder="Observação interna (não visível ao cliente)..."
              value={obs} onChange={e => setObs(e.target.value)} />
          )}
        </div>

        {/* Concluir */}
        <button
          onClick={() => onConcluir(ag.id, obs || undefined)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #34C759, #16a34a)',
            boxShadow: '0 0 24px rgba(52,199,89,0.35)',
          }}>
          <CheckCircle className="w-5 h-5" />
          Marcar como Concluído
        </button>
      </div>
    </div>
  )
}

export default function ServicoEmAndamentoPage() {
  const qc = useQueryClient()

  const { data: agendamentos = [], isLoading } = useQuery<AgEmAndamento[]>({
    queryKey: ['em-andamento'],
    queryFn:  () => fetch('/api/agendamentos?status=em_andamento&data=' + new Date().toISOString().split('T')[0]).then(r => r.json()),
    refetchInterval: 15000,
  })

  const concluirMutation = useMutation({
    mutationFn: ({ id, observacoesInternas }: { id: string; observacoesInternas?: string }) =>
      fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluido', observacoesInternas }),
      }),
    onSuccess: () => {
      toast.success('Serviço concluído! 🎉')
      qc.invalidateQueries({ queryKey: ['em-andamento'] })
      qc.invalidateQueries({ queryKey: ['fila'] })
    },
    onError: () => toast.error('Erro ao concluir serviço'),
  })

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 safe-top glass-strong px-4 py-4"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <h1 className="font-black text-white">Em Serviço</h1>
        <p className="text-xs text-white/35 mt-0.5">
          {agendamentos.length} serviço(s) em andamento
        </p>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(157,78,221,0.06)', border: '1px solid rgba(157,78,221,0.15)' }}>
              <Car className="w-10 h-10 text-white/15" />
            </div>
            <p className="font-black text-white mb-2">Nenhum serviço em andamento</p>
            <p className="text-sm text-white/35">Inicie um atendimento pela fila</p>
          </div>
        ) : agendamentos.map(ag => (
          <ServicoCard
            key={ag.id}
            ag={ag}
            onConcluir={(id, obs) => concluirMutation.mutate({ id, observacoesInternas: obs })}
          />
        ))}
      </div>
    </div>
  )
}
