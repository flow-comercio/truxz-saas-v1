'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, CheckCircle, Loader2, User, Car } from 'lucide-react'

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
  const [busca, setBusca] = useState('')
  const [resultado, setResultado] = useState<ClienteResult | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [checked, setChecked] = useState(false)

  async function buscarAgendamento() {
    if (!busca.trim()) return
    setBuscando(true)
    setResultado(null)
    setChecked(false)
    try {
      const res = await fetch(`/api/operacional/checkin?q=${encodeURIComponent(busca)}`)
      const data = await res.json()
      if (!res.ok || !data) {
        toast.error('Nenhum agendamento encontrado para hoje')
      } else {
        setResultado(data)
      }
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
      toast.success('Check-in realizado! Cliente confirmado.')
      setChecked(true)
      qc.invalidateQueries({ queryKey: ['fila'] })
    },
    onError: () => toast.error('Erro ao realizar check-in'),
  })

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-bold text-gray-900">Check-in</h1>
        <p className="text-xs text-gray-500 mt-0.5">Busque pelo nome, telefone ou placa</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Nome, telefone ou placa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarAgendamento()}
            />
          </div>
          <button onClick={buscarAgendamento} disabled={buscando} className="btn-primary px-4">
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`card border-2 ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-orange-300 bg-orange-50'}`}>
            {checked ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-emerald-700 text-lg">Check-in Confirmado!</p>
                <p className="text-emerald-600 text-sm mt-1">{resultado.clienteNome}</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agendamento Encontrado</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-900">{resultado.clienteNome}</p>
                      <p className="text-xs text-gray-500">{resultado.clienteTelefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-700">{resultado.servicoNome}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(resultado.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => confirmarMutation.mutate(resultado.agendamentoId)}
                  disabled={confirmarMutation.isPending || resultado.status === 'confirmado'}
                  className="btn-primary w-full"
                >
                  {confirmarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {resultado.status === 'confirmado' ? 'Já confirmado' : 'Confirmar Check-in'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Instrução inicial */}
        {!resultado && !buscando && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Busque o cliente para fazer o check-in</p>
            <p className="text-sm text-gray-400 mt-1">Use nome, telefone ou placa do veículo</p>
          </div>
        )}
      </div>
    </div>
  )
}
