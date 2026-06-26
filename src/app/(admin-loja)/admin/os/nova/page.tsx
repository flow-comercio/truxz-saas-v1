'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, Car, User, Search, ChevronRight, Loader2, ScanLine, Check } from 'lucide-react'
import { CameraOCR } from '@/components/admin/camera-ocr'

interface Cliente { id: string; nome: string; telefone: string | null }
interface Veiculo { id: string; placa: string; modelo: string | null; marca: string | null; cor: string | null }

export default function NovaOsPage() {
  const router = useRouter()
  const [showOCR, setShowOCR] = useState(false)
  const [placaManual, setPlacaManual] = useState('')
  const [placaOCR, setPlacaOCR] = useState('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null)
  const [quilometragem, setQuilometragem] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [previsao, setPrevisao] = useState('')

  const placaFinal = placaOCR || placaManual

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes-busca', clienteBusca],
    queryFn: () => fetch(`/api/clientes?q=${clienteBusca}`).then(r => r.json()),
    enabled: clienteBusca.length >= 2,
  })

  const { data: veiculos = [] } = useQuery<Veiculo[]>({
    queryKey: ['veiculos', clienteSelecionado?.id],
    queryFn: () => fetch(`/api/veiculos?clienteId=${clienteSelecionado!.id}`).then(r => r.json()),
    enabled: !!clienteSelecionado,
  })

  const criarOs = useMutation({
    mutationFn: (data: object) =>
      fetch('/api/os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (os) => {
      toast.success(`OS #${os.numero} criada!`)
      router.push(`/admin/os/${os.id}`)
    },
    onError: () => toast.error('Erro ao criar OS'),
  })

  function handlePlacaOCR(placa: string) {
    setPlacaOCR(placa)
    setPlacaManual('')
    setShowOCR(false)
    toast.success(`Placa ${placa} lida com sucesso!`)
  }

  function handleSubmit() {
    if (!clienteSelecionado) return toast.error('Selecione um cliente')
    criarOs.mutate({
      clienteId: clienteSelecionado.id,
      veiculoId: veiculoSelecionado?.id ?? null,
      placaLida: placaOCR || null,
      placaConfirmada: !!placaOCR,
      quilometragem: quilometragem ? parseInt(quilometragem) : null,
      observacoes: observacoes || null,
      previsaoEntrega: previsao || null,
    })
  }

  return (
    <>
      {showOCR && (
        <CameraOCR
          onPlacaDetectada={handlePlacaOCR}
          onClose={() => setShowOCR(false)}
        />
      )}

      <div className="p-4 lg:p-6 space-y-5 pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ChevronRight className="w-4 h-4 rotate-180 text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Nova Ordem de Serviço</h1>
        </div>

        {/* Placa - OCR ou manual */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>
            <Car className="w-3.5 h-3.5 inline mr-1" /> Placa do Veículo
          </p>

          {placaFinal ? (
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)' }}>
              <div>
                <p className="text-2xl font-black tracking-widest text-white">{placaFinal}</p>
                {placaOCR && <p className="text-xs mt-0.5" style={{ color: '#9D4EDD' }}>✓ Lida por OCR</p>}
              </div>
              <button onClick={() => { setPlacaOCR(''); setPlacaManual('') }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ color: '#A0A0B8', background: 'rgba(255,255,255,0.05)' }}>
                Alterar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowOCR(true)}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(157,78,221,0.3), rgba(123,47,190,0.2))', border: '1.5px dashed rgba(157,78,221,0.5)' }}>
                <ScanLine className="w-5 h-5" style={{ color: '#9D4EDD' }} />
                Ler placa com câmera (OCR)
              </button>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: '#55556A' }}>ou digite</span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <input
                className="input uppercase tracking-widest text-center text-lg font-bold"
                placeholder="ABC1D23"
                maxLength={8}
                value={placaManual}
                onChange={e => setPlacaManual(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>
            <User className="w-3.5 h-3.5 inline mr-1" /> Cliente
          </p>

          {clienteSelecionado ? (
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)' }}>
              <div>
                <p className="font-bold text-white">{clienteSelecionado.nome}</p>
                {clienteSelecionado.telefone && (
                  <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>{clienteSelecionado.telefone}</p>
                )}
              </div>
              <button onClick={() => { setClienteSelecionado(null); setVeiculoSelecionado(null) }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ color: '#A0A0B8', background: 'rgba(255,255,255,0.05)' }}>
                Trocar
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#55556A' }} />
                <input
                  className="input pl-9"
                  placeholder="Buscar por nome ou telefone..."
                  value={clienteBusca}
                  onChange={e => setClienteBusca(e.target.value)}
                />
              </div>
              {clientes.length > 0 && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(157,78,221,0.2)' }}>
                  {clientes.slice(0, 5).map(c => (
                    <button key={c.id}
                      onClick={() => { setClienteSelecionado(c); setClienteBusca('') }}
                      className="w-full text-left px-4 py-3 transition-colors border-b last:border-0 flex items-center justify-between"
                      style={{ borderColor: 'rgba(157,78,221,0.1)', background: 'rgba(255,255,255,0.02)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(157,78,221,0.08)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                    >
                      <div>
                        <p className="font-semibold text-white text-sm">{c.nome}</p>
                        {c.telefone && <p className="text-xs" style={{ color: '#55556A' }}>{c.telefone}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: '#55556A' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Veículo (se cliente selecionado) */}
        {clienteSelecionado && veiculos.length > 0 && !veiculoSelecionado && (
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>
              Veículo (opcional)
            </p>
            {veiculos.map(v => (
              <button key={v.id}
                onClick={() => setVeiculoSelecionado(v)}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="font-bold text-white tracking-wider">{v.placa}</p>
                  <p className="text-xs" style={{ color: '#A0A0B8' }}>
                    {[v.marca, v.modelo, v.cor].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#55556A' }} />
              </button>
            ))}
          </div>
        )}

        {veiculoSelecionado && (
          <div className="rounded-2xl p-3 flex items-center justify-between"
            style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)' }}>
            <div>
              <p className="font-bold text-white text-sm tracking-wider">{veiculoSelecionado.placa}</p>
              <p className="text-xs" style={{ color: '#A0A0B8' }}>
                {[veiculoSelecionado.marca, veiculoSelecionado.modelo, veiculoSelecionado.cor].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button onClick={() => setVeiculoSelecionado(null)} className="text-xs" style={{ color: '#55556A' }}>
              Remover
            </button>
          </div>
        )}

        {/* Detalhes */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Detalhes</p>
          <div>
            <label className="label">Quilometragem atual</label>
            <input type="number" className="input" placeholder="Ex: 45000" value={quilometragem}
              onChange={e => setQuilometragem(e.target.value)} />
          </div>
          <div>
            <label className="label">Previsão de entrega</label>
            <input type="datetime-local" className="input" value={previsao}
              onChange={e => setPrevisao(e.target.value)} />
          </div>
          <div>
            <label className="label">Observações iniciais</label>
            <textarea className="input" rows={3} placeholder="Problema relatado pelo cliente..."
              value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:ml-60" style={{ background: 'rgba(13,11,30,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(157,78,221,0.15)' }}>
        <button
          onClick={handleSubmit}
          disabled={!clienteSelecionado || criarOs.isPending}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {criarOs.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {criarOs.isPending ? 'Criando OS...' : 'Abrir Ordem de Serviço'}
        </button>
      </div>
    </>
  )
}
