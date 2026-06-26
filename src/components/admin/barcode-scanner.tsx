'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ScanLine, X, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(true)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const detectedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
      if (result && !detectedRef.current) {
        detectedRef.current = true
        setLendo(false)
        // Vibração feedback no mobile
        if (navigator.vibrate) navigator.vibrate(100)
        reader.reset()
        onDetected(result.getText())
      }
    })

    return () => {
      reader.reset()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      <div className="flex items-center justify-between p-4 pt-safe">
        <div>
          <h2 className="text-white font-bold text-lg">Leitor de Código de Barras</h2>
          <p className="text-gray-400 text-xs">Aponte para o código EAN ou Code128</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Scanner overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-72 h-32">
            <div className="absolute inset-0 border-2 border-transparent" />
            {/* Animated scan line */}
            <div className="absolute inset-x-0 h-0.5 bg-red-500 opacity-80 animate-pulse"
              style={{ top: '50%', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }} />
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br" />
          </div>
        </div>

        {!lendo && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="text-center">
              <ScanLine className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-white font-bold">Código lido!</p>
            </div>
          </div>
        )}

        {erro && (
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl text-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}
      </div>

      <div className="p-4 pb-safe text-center">
        <p className="text-gray-400 text-sm">
          <ScanLine className="w-4 h-4 inline mr-1" />
          Aponte a câmera para o código de barras
        </p>
      </div>
    </div>
  )
}
