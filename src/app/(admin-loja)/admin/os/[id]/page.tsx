'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, Clock, Wrench, Package, User,
  Car, FileText, ChevronDown, AlertCircle, Loader2, Receipt,
  PenLine, Trash2, Check
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_OS: Record<string, { label: string; cor: string; next: string | null; nextLabel: string | null }> = {
  aberta:               { label: 'Aberta',           cor: '#F59E0B', next: 'em_execucao',          nextLabel: 'Iniciar Execução' },
  diagnostico:          { label: 'Diagnóstico',      cor: '#F59E0B', next: 'em_execucao',          nextLabel: 'Iniciar Execução' },
  aguardando_aprovacao: { label: 'Ag. Aprovação',    cor: '#F59E0B', next: 'aprovada',              nextLabel: 'Aprovar' },
  aprovada:             { label: 'Aprovada',          cor: '#9D4EDD', next: 'em_execucao',          nextLabel: 'Iniciar Execução' },
  em_execucao:          { label: 'Em Execução',       cor: '#9D4EDD', next: 'concluida',            nextLabel: 'Marcar Concluída' },
  aguardando_peca:      { label: 'Ag. Peça',         cor: '#6B7280', next: 'em_execucao',          nextLabel: 'Retomar' },
  concluida:            { label: 'Concluída',         cor: '#10B981', next: 'entregue',             nextLabel: 'Confirmar Entrega' },
  cancelada:            { label: 'Cancelada',         cor: '#EF4444', next: null,                   nextLabel: null },
  entregue:             { label: 'Entregue',          cor: '#10B981', next: null,                   nextLabel: null },
}

const CHECKLIST_PADRAO = [
  'Verificar nível de combustível',
  'Conferir documentos no veículo',
  'Fotografar arranhões/amassados',
  'Anotar quilometragem',
  'Verificar pneus e rodas',
  'Conferir itens de valor no interior',
]

const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.15)', borderRadius: 16 }
const shimmer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.35),transparent)' }

function AssinaturaPad({ onSave, assinaturaUrl }: { onSave: (dataUrl: string) => void; assinaturaUrl?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [saved, setSaved] = useState(!!assinaturaUrl)

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    isDrawing.current = true
    setSaved(false)
    const pos = 'touches' in e ? getPos(e.touches[0], canvas) : getPos(e.nativeEvent as MouseEvent, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = 'touches' in e ? getPos(e.touches[0], canvas) : getPos(e.nativeEvent as MouseEvent, canvas)
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
    setHasStrokes(true)
  }, [])

  const stopDraw = useCallback(() => { isDrawing.current = false }, [])

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false); setSaved(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (assinaturaUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = assinaturaUrl
    }
  }, [assinaturaUrl])

  const save = () => {
    const canvas = canvasRef.current; if (!canvas || !hasStrokes) return
    onSave(canvas.toDataURL('image/png'))
    setSaved(true)
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(157,78,221,0.4)' }}>
        <canvas
          ref={canvasRef} width={600} height={180}
          className="w-full touch-none"
          style={{ cursor: 'crosshair', display: 'block' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        {!hasStrokes && !assinaturaUrl && (
          <span className="absolute inset-0 flex items-center justify-center text-xs pointer-events-none" style={{ color: '#55556A' }}>
            Assine aqui com o dedo ou mouse
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={clear} className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Trash2 className="w-3.5 h-3.5" /> Limpar
        </button>
        <button onClick={save} disabled={!hasStrokes || saved} className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-40"
          style={{ background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(157,78,221,0.2)', color: saved ? '#10B981' : '#9D4EDD', border: `1px solid ${saved ? 'rgba(16,185,129,0.3)' : 'rgba(157,78,221,0.3)'}` }}>
          <Check className="w-3.5 h-3.5" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export default function OsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: os, isLoading } = useQuery<any>({
    queryKey: ['os', id],
    queryFn: () => fetch(`/api/os/${id}`).then(r => r.json()),
  })

  const [checklist, setChecklist] = useState<{ item: string; ok: boolean | null; obs?: string }[]>([])

  useEffect(() => {
    if (os) {
      setChecklist(
        os.checklist?.length
          ? os.checklist
          : CHECKLIST_PADRAO.map(item => ({ item, ok: null }))
      )
    }
  }, [os])

  const patchMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/os/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Erro'); return j }),
    onSuccess: () => { toast.success('OS atualizada'); qc.invalidateQueries({ queryKey: ['os', id] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#9D4EDD' }} />
    </div>
  )
  if (!os || os.error) return (
    <div className="p-6 text-center" style={{ color: '#A0A0B8' }}>OS não encontrada</div>
  )

  const cfg = STATUS_OS[os.status] ?? STATUS_OS.aberta
  const totalItens = os.itens?.reduce((s: number, i: any) => s + parseFloat(i.total), 0) ?? 0

  function salvarChecklist() {
    patchMutation.mutate({ checklist })
  }

  function avancarStatus() {
    if (!cfg.next) return
    patchMutation.mutate({ status: cfg.next, checklist })
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/os" className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">OS #{os.numero}</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: cfg.cor + '20', color: cfg.cor }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#55556A' }}>
            Criada em {formatDateTime(os.criadoEm)}
          </p>
        </div>
      </div>

      {/* Cliente + Veículo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative p-4 space-y-1" style={glass}>
          <div style={shimmer} />
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Cliente</span>
          </div>
          <p className="font-bold text-white text-sm">{os.cliente?.nome || '—'}</p>
          <p className="text-xs" style={{ color: '#A0A0B8' }}>{os.cliente?.telefone || ''}</p>
        </div>
        <div className="relative p-4 space-y-1" style={glass}>
          <div style={shimmer} />
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#55556A' }}>Veículo</span>
          </div>
          <p className="font-bold text-white text-sm">
            {os.veiculo ? `${os.veiculo.marca ?? ''} ${os.veiculo.modelo ?? ''}`.trim() || os.veiculo.placa : '—'}
          </p>
          <p className="text-xs" style={{ color: '#A0A0B8' }}>{os.veiculo?.placa || ''}</p>
        </div>
      </div>

      {/* Itens da OS */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4" style={{ color: '#9D4EDD' }} />
          <span className="font-bold text-white">Serviços e Produtos</span>
        </div>
        {os.itens?.length > 0 ? (
          <div className="space-y-2">
            {os.itens.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.servicoNome || item.descricao}
                  </p>
                  <p className="text-xs" style={{ color: '#55556A' }}>
                    {item.tipo === 'produto' ? <Package className="w-3 h-3 inline mr-1" /> : <Wrench className="w-3 h-3 inline mr-1" />}
                    {parseFloat(item.quantidade)}x R$ {parseFloat(item.precoUnitario).toFixed(2)}
                  </p>
                </div>
                <span className="font-black text-white">{formatCurrency(parseFloat(item.total))}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="font-bold text-white">Total</span>
              <span className="font-black text-xl" style={{ color: '#9D4EDD' }}>{formatCurrency(totalItens)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: '#55556A' }}>Nenhum item adicionado</p>
        )}
      </div>

      {/* Checklist */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="font-bold text-white">Checklist</span>
          </div>
          <span className="text-xs" style={{ color: '#55556A' }}>
            {checklist.filter(c => c.ok === true).length}/{checklist.length}
          </span>
        </div>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <button
                onClick={() => setChecklist(prev => prev.map((c, j) => j === i ? { ...c, ok: c.ok === true ? null : true } : c))}
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: item.ok === true ? '#10B981' : item.ok === false ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  border: item.ok === null ? '2px solid rgba(255,255,255,0.2)' : 'none',
                }}>
                {item.ok === true && <CheckCircle2 className="w-3 h-3 text-white" />}
                {item.ok === false && <AlertCircle className="w-3 h-3 text-white" />}
              </button>
              <span className="text-sm flex-1 text-white">{item.item}</span>
              <button
                onClick={() => setChecklist(prev => prev.map((c, j) => j === i ? { ...c, ok: c.ok === false ? null : false } : c))}
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}>
                NOK
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={salvarChecklist}
          disabled={patchMutation.isPending}
          className="mt-3 w-full py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'rgba(157,78,221,0.15)', color: '#9D4EDD', border: '1px solid rgba(157,78,221,0.3)' }}>
          Salvar Checklist
        </button>
      </div>

      {/* Observações */}
      <div className="relative p-4" style={glass}>
        <div style={shimmer} />
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#55556A' }}>
          Observações
        </label>
        <textarea
          defaultValue={os.observacoes ?? ''}
          rows={3}
          onBlur={e => patchMutation.mutate({ observacoes: e.target.value })}
          className="w-full bg-transparent text-sm resize-none outline-none"
          style={{ color: '#A0A0B8' }}
          placeholder="Anotações sobre a execução..."
        />
      </div>

      {/* Timestamps de progresso */}
      {(os.iniciadoEm || os.concluidoEm || os.entregueEm) && (
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#55556A' }}>Linha do Tempo</p>
          <div className="space-y-2 text-xs" style={{ color: '#A0A0B8' }}>
            <div className="flex justify-between"><span>Criada</span><span>{formatDateTime(os.criadoEm)}</span></div>
            {os.iniciadoEm && <div className="flex justify-between"><span>Iniciada</span><span>{formatDateTime(os.iniciadoEm)}</span></div>}
            {os.concluidoEm && <div className="flex justify-between"><span>Concluída</span><span>{formatDateTime(os.concluidoEm)}</span></div>}
            {os.entregueEm && <div className="flex justify-between"><span>Entregue</span><span>{formatDateTime(os.entregueEm)}</span></div>}
          </div>
        </div>
      )}

      {/* Assinatura Digital do Cliente */}
      {(os.status === 'concluida' || os.status === 'entregue') && (
        <div className="relative p-4" style={glass}>
          <div style={shimmer} />
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-4 h-4" style={{ color: '#9D4EDD' }} />
            <span className="font-bold text-white">Assinatura do Cliente</span>
            {os.assinaturaClienteUrl && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                Coletada
              </span>
            )}
          </div>
          <AssinaturaPad
            assinaturaUrl={os.assinaturaClienteUrl}
            onSave={(dataUrl) => patchMutation.mutate({ assinaturaClienteUrl: dataUrl })}
          />
        </div>
      )}

      {/* Botão de avançar status */}
      {cfg.next && (
        <button
          onClick={avancarStatus}
          disabled={patchMutation.isPending}
          className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
          {patchMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {cfg.nextLabel}
        </button>
      )}

      {/* Cancelar */}
      {os.status !== 'cancelada' && os.status !== 'entregue' && (
        <button
          onClick={() => { if (confirm('Cancelar esta OS?')) patchMutation.mutate({ status: 'cancelada' }) }}
          className="w-full py-3 rounded-2xl text-sm font-bold"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          Cancelar OS
        </button>
      )}
    </div>
  )
}
