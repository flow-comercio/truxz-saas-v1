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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacao: nota, comentarioAvaliacao: comentario }),
      }).then(async r => { if (!r.ok) throw new Error('Erro ao enviar'); return r.json() }),
    onSuccess: () => { toast.success('Avaliação enviada! Obrigado!'); router.push('/cliente/historico') },
    onError: () => toast.error('Erro ao enviar avaliação'),
  })

  const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!']
  const active = hover || nota

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0B1E', fontFamily: 'Nunito, sans-serif' }}>
      <div className="px-4 py-4 sticky top-0 z-10 flex items-center gap-3"
        style={{ background: 'rgba(13,11,30,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <Link href={`/cliente/agendamento/${params.id}`}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(157,78,221,0.15)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#A0A0B8' }} />
        </Link>
        <h1 className="font-black text-white">Avaliar Serviço</h1>
      </div>

      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Star className="w-8 h-8" style={{ color: '#FBBF24' }} />
          </div>
          <h2 className="font-black text-white text-xl">Como foi o atendimento?</h2>
          <p className="text-sm mt-1" style={{ color: '#A0A0B8' }}>Sua opinião nos ajuda a melhorar</p>
        </div>

        {/* Estrelas */}
        <div>
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setNota(n)}
                className="transition-all" style={{ transform: active >= n ? 'scale(1.15)' : 'scale(1)' }}>
                <Star className="w-12 h-12 transition-all"
                  style={{ color: active >= n ? '#FBBF24' : 'rgba(255,255,255,0.1)', fill: active >= n ? '#FBBF24' : 'transparent' }} />
              </button>
            ))}
          </div>
          {active > 0 && (
            <p className="text-center font-black text-lg" style={{ color: '#FBBF24' }}>{LABELS[active]}</p>
          )}
        </div>

        {/* Comentário */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#55556A' }}>
            Comentário (opcional)
          </label>
          <textarea className="input" rows={4}
            placeholder="Conte mais sobre sua experiência..."
            value={comentario} onChange={e => setComentario(e.target.value)} />
        </div>

        <button
          onClick={() => avaliarMutation.mutate()}
          disabled={nota === 0 || avaliarMutation.isPending}
          className="btn-primary w-full">
          {avaliarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
          {avaliarMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </div>
  )
}
