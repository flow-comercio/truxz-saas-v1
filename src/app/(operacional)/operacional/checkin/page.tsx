'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, CheckCircle, Loader2, User, Car, Clock, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ClienteResult {
  agendamentoId: string
  clienteNome: string
  clienteTelefone: string
  servicoNome: string
  dataHoraInicio: string
  status: string
  precoTotal: string
}

export default function CheckinPage() {
  const qc = useQueryClient()
  const [busca, setBusca]         = useState('')
  const [resultado, setResultado] = useState<ClienteResult | null>(null)
  const [buscando, setBuscando]   = useState(false)
  const [checked, setChecked]     = useState(false)

  async function buscarAgendamento() {
    if (!busca.trim()) return
    setBuscando(true); setResultado(null); setChecked(false)
    try {
      const res  = await fetch(`/api/operacional/checkin?q=${encodeURIComponent(busca)}`)
      const data = await res.json()
      if (!res.ok || !data) toast.error('Nenhum agendamento encontrado para hoje')
      else setResultado(data)
    } catch {
      toast.error('Erro ao buscar agendamento')
    } finally {
      setBuscando(false)
    }
  }

  const confirmarMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmado' }),
      }),
    onSuccess: () => {
      toast.success('Check-in realizado!')
      setChecked(true)
      qc.invalidateQueries({ queryKey: ['fila'] })
    },
    onError: () => toast.error('Erro ao realizar check-in'),
  })

  function resetar() {
    setBusca(''); setResultado(null); setChecked(false)
  }

  const hora = resultado?.dataHoraInicio
    ? new Date(resultado.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 safe-top glass-strong px-4 py-4"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <h1 className="font-black text-white">Check-in</h1>
        <p className="text-xs text-white/35 mt-0.5">Busque pelo nome, telefone ou placa</p>
      </div>

      <div className="p-4 space-y-4">

        {/* ── BUSCA ──────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              className="input pl-10 pr-10"
              placeholder="Nome, telefone ou placa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarAgendamento()}
              autoFocus
            />
            {busca && (
              <button onClick={resetar}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={buscarAgendamento} disabled={buscando || !busca.trim()}
            className="btn-primary px-5">
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {/* ── RESULTADO ──────────────────────────────── */}
        {checked && resultado ? (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(52,199,89,0.12)',
                border: '2px solid rgba(52,199,89,0.4)',
                boxShadow: '0 0 40px rgba(52,199,89,0.2)',
              }}>
              <CheckCircle className="w-10 h-10 text-[#34C759]" />
            </div>
            <p className="font-black text-white text-xl mb-1">Check-in Confirmado!</p>
            <p className="text-[#34C759] font-bold mb-1">{resultado.clienteNome}</p>
            <p className="text-white/35 text-sm">{resultado.servicoNome}</p>
            <button onClick={resetar} className="btn-secondary mt-6 mx-auto px-6">
              Nova busca
            </button>
          </div>
        ) : resultado ? (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#9D4EDD]" />
              <span className="text-xs font-black uppercase tracking-widest text-white/35">
                Agendamento encontrado
              </span>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.2)' }}>
                  <User className="w-5 h-5 text-[#9D4EDD]" />
                </div>
                <div>
                  <p className="font-black text-white">{resultado.clienteNome}</p>
                  <p className="text-xs text-white/40">{resultado.clienteTelefone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(63,142,255,0.1)', border: '1px solid rgba(63,142,255,0.2)' }}>
                  <Car className="w-5 h-5 text-[#3F8EFF]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{resultado.servicoNome}</p>
                  <p className="text-xs text-white/40">{formatCurrency(parseFloat(resultado.precoTotal))}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.2)' }}>
                  <Clock className="w-5 h-5 text-[#FF9F0A]" />
                </div>
                <div>
                  <p className="font-black text-white text-lg tabular-nums">{hora}</p>
                  <p className="text-xs text-white/40">Horário agendado</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => confirmarMutation.mutate(resultado.agendamentoId)}
              disabled={confirmarMutation.isPending || resultado.status === 'confirmado'}
              className="btn-primary w-full" style={{ height: 52 }}>
              {confirmarMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
                : resultado.status === 'confirmado'
                  ? <><CheckCircle className="w-4 h-4" /> Já confirmado</>
                  : <><CheckCircle className="w-4 h-4" /> Confirmar Check-in</>}
            </button>
          </div>
        ) : !buscando && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(157,78,221,0.06)', border: '1px solid rgba(157,78,221,0.15)' }}>
              <Search className="w-10 h-10 text-white/15" />
            </div>
            <p className="font-bold text-white/35">Busque o cliente</p>
            <p className="text-xs text-white/20 mt-1">Nome, telefone ou placa do veículo</p>
          </div>
        )}

      </div>
    </div>
  )
}
