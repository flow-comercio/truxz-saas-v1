'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, X, Loader2, ImagePlus } from 'lucide-react'
import Image from 'next/image'

interface Props {
  agendamentoId: string
  tipo: 'antes' | 'depois'
  fotos: string[]
  readOnly?: boolean
}

export function UploadFotos({ agendamentoId, tipo, fotos, readOnly = false }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>(fotos)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('agendamentoId', agendamentoId)
      form.append('tipo', tipo)
      form.append('arquivo', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro no upload')
      return json as { url: string }
    },
    onSuccess: (data) => {
      setPreviews(p => [...p, data.url])
      toast.success('Foto enviada!')
      qc.invalidateQueries({ queryKey: ['agendamento', agendamentoId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (url: string) =>
      fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendamentoId, tipo, url }),
      }),
    onSuccess: (_data, url) => {
      setPreviews(p => p.filter(f => f !== url))
      toast.success('Foto removida')
    },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file)
    e.target.value = ''
  }

  const label = tipo === 'antes' ? 'Fotos Antes' : 'Fotos Depois'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        {!readOnly && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            {uploadMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ImagePlus className="w-3.5 h-3.5" />
            }
            Adicionar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {previews.length === 0 ? (
        !readOnly ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-orange-300 hover:bg-orange-50 transition-colors text-gray-400"
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs">Clique para adicionar foto</span>
          </button>
        ) : (
          <p className="text-xs text-gray-400 italic">Nenhuma foto</p>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={url}
                alt={`${label} ${i + 1}`}
                fill
                className="object-cover"
              />
              {!readOnly && (
                <button
                  onClick={() => deleteMutation.mutate(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
          {!readOnly && previews.length < 5 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
