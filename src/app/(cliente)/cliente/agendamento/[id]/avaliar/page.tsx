'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function AvaliarAgendamentoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')

  const avaliarMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/agendamentos/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacao: nota, comentarioAvaliacao: comentario }),
      }).then(async r => {
        if (!r.ok) throw new Error('Erro ao enviar avaliação')
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Avaliação enviada! Obrigado 😊')
      router.push('/cliente/historico')
    },
    onError: () => toast.error('Erro ao enviar avaliação'),
  })

  const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!']

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href={`/cliente/agendamento/${params.id}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="font-bold text-gray-900">Avaliar Serviço</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-2xl mb-1">⭐</p>
          <h2 className="font-bold text-gray-900 text-lg">Como foi o atendimento?</h2>
          <p className="text-sm text-gray-500 mt-1">Sua opinião nos ajuda a melhorar</p>
        </div>

        {/* Estrelas */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setNota(n)}
            >
              <Star
                className={`w-12 h-12 transition-all ${
                  (hover || nota) >= n
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        {(hover || nota) > 0 && (
          <p className="text-center font-semibold text-gray-700">
            {LABELS[hover || nota]}
          </p>
        )}

        {/* Comentário */}
        <div>
          <label className="label">Comentário (opcional)</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Conte mais sobre sua experiência..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />
        </div>

        <button
          onClick={() => avaliarMutation.mutate()}
          disabled={nota === 0 || avaliarMutation.isPending}
          className="btn-primary w-full"
        >
          {avaliarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {avaliarMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </div>
  )
}
