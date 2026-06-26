'use client'
import { useRef, useState, useCallback } from 'react'
import { Camera, X, RotateCcw, Check, Loader2, AlertCircle } from 'lucide-react'

interface CameraOCRProps {
  onPlacaDetectada: (placa: string) => void
  onClose: () => void
}

export function CameraOCR({ onPlacaDetectada, onClose }: CameraOCRProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [fase, setFase] = useState<'camera' | 'processando' | 'resultado'>('camera')
  const [placa, setPlaca] = useState<string | null>(null)
  const [confianca, setConfianca] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)
  const [cameraAtiva, setCameraAtiva] = useState(false)

  const iniciarCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraAtiva(true)
      }
    } catch {
      setErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
    }
  }, [])

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraAtiva(false)
  }, [])

  const capturar = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
    pararCamera()
    setFase('processando')

    try {
      const res = await fetch('/api/ai/ocr-placa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (data.placa) {
        setPlaca(data.placa)
        setConfianca(data.confianca)
        setFase('resultado')
      } else {
        setErro('Não foi possível identificar a placa. Tente novamente.')
        setFase('camera')
        iniciarCamera()
      }
    } catch {
      setErro('Erro ao processar imagem. Tente novamente.')
      setFase('camera')
      iniciarCamera()
    }
  }, [pararCamera, iniciarCamera])

  const confirmar = () => {
    if (placa) { onPlacaDetectada(placa); pararCamera() }
  }

  const reiniciar = () => {
    setPlaca(null); setErro(null); setFase('camera'); iniciarCamera()
  }

  // Auto-start camera on mount
  if (!cameraAtiva && fase === 'camera' && !erro) {
    iniciarCamera()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <h2 className="text-white font-bold text-lg">Ler Placa</h2>
        <button onClick={() => { pararCamera(); onClose() }}
          className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted
          className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Plate frame overlay */}
        {fase === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-72 h-20 border-2 border-white rounded-lg opacity-80" />
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br" />
              <p className="text-center text-white text-xs mt-3 font-medium">
                Posicione a placa dentro do quadro
              </p>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {fase === 'processando' && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-semibold">Identificando placa...</p>
              <p className="text-gray-400 text-sm mt-1">IA analisando imagem</p>
            </div>
          </div>
        )}

        {/* Result overlay */}
        {fase === 'resultado' && placa && (
          <div className="absolute inset-0 flex items-end"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full p-6 rounded-t-3xl" style={{ background: '#12101E' }}>
              <p className="text-center text-sm font-medium mb-2" style={{ color: '#A0A0B8' }}>
                Placa identificada
              </p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-4xl font-black text-white tracking-widest">{placa}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  confianca === 'alta' ? 'bg-green-500/20 text-green-400' :
                  confianca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {confianca === 'alta' ? '✓ Alta' : confianca === 'media' ? '~ Média' : '! Baixa'} confiança
                </span>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={reiniciar}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#A0A0B8' }}>
                  <RotateCcw className="w-4 h-4" /> Tentar novamente
                </button>
                <button onClick={confirmar}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' }}>
                  <Check className="w-4 h-4" /> Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Capture button */}
      {fase === 'camera' && (
        <div className="p-6 pb-safe flex flex-col items-center gap-3">
          {erro && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>{erro}</span>
            </div>
          )}
          <button onClick={capturar}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Camera className="w-8 h-8 text-white" />
          </button>
          <p className="text-gray-400 text-xs">Toque para capturar</p>
        </div>
      )}
    </div>
  )
}
