'use client'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Trophy, Zap, Lock } from 'lucide-react'

const NIVEL_LABELS = ['', 'Kart', 'F3', 'F2', 'F1', 'Lenda', 'CAMPEÃO']
const NIVEL_COLORS = ['', '#A0A0B8', '#4ADE80', '#60A5FA', '#DC0000', '#FFD700', '#FFD700']

interface Conquista {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  icone: string | null
  cor: string | null
  pontosRecompensa: number
  desbloqueada: boolean
  desbloqueadoEm: string | null
}

interface RankingItem {
  operadorId: string
  pontosAtuais: number
  totalHistorico: number
  nivel: number
  nome: string
  posicao: number
  isEu: boolean
}

interface Data {
  conquistas: Conquista[]
  ranking: RankingItem[]
  total: number
  desbloqueadas: number
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ConquistasPage() {
  const { data, isLoading } = useQuery<Data>({
    queryKey: ['conquistas'],
    queryFn: () => fetch('/api/gamificacao/conquistas').then(r => r.json()),
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FFD700' }} />
        <p className="text-xs font-racing tracking-widest uppercase" style={{ color: '#55556A' }}>Carregando Troféus...</p>
      </div>
    </div>
  )

  if (!data) return null

  const desbloqueadas = data.conquistas.filter(c => c.desbloqueada)
  const bloqueadas    = data.conquistas.filter(c => !c.desbloqueada)
  const pct = data.total > 0 ? Math.round((data.desbloqueadas / data.total) * 100) : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0A0A0F' }}>

      {/* HEADER */}
      <div className="relative overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
        <div className="absolute top-0 left-0 right-0 h-2 checkers-stripe" />
        <div className="absolute top-2 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #FFD700 30%, #DC0000 70%, transparent)' }} />

        <div className="relative p-5 pt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)' }}>
              <Trophy className="w-6 h-6" style={{ color: '#FFD700' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[4px] mb-0.5" style={{ color: '#FFD700' }}>
                Hall da Fama
              </p>
              <h1 className="text-2xl font-black text-white font-display tracking-wider">Conquistas</h1>
            </div>
          </div>

          {/* barra de progresso geral */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-racing">
              <span style={{ color: '#A0A0B8' }}>{data.desbloqueadas} de {data.total} troféus</span>
              <span style={{ color: '#FFD700' }}>{pct}% completo</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FFD700, #DC0000)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* CONQUISTAS DESBLOQUEADAS */}
        {desbloqueadas.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: '#FFD700' }}>
              🏆 Desbloqueadas ({desbloqueadas.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {desbloqueadas.map(c => (
                <div key={c.id} className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: `${c.cor ?? '#FFD700'}10`,
                    border: `1px solid ${c.cor ?? '#FFD700'}35`,
                  }}>
                  {/* shimmer */}
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${c.cor ?? '#FFD700'}60, transparent)` }} />

                  <div className="text-3xl mb-2">{c.icone ?? '🏆'}</div>
                  <p className="text-sm font-black font-racing text-white leading-tight">{c.nome}</p>
                  {c.descricao && (
                    <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#A0A0B8' }}>{c.descricao}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    {c.pontosRecompensa > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" style={{ color: c.cor ?? '#FFD700' }} />
                        <span className="text-[10px] font-black font-racing" style={{ color: c.cor ?? '#FFD700' }}>
                          +{c.pontosRecompensa} pts
                        </span>
                      </div>
                    )}
                    {c.desbloqueadoEm && (
                      <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>
                        {formatDate(c.desbloqueadoEm)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONQUISTAS BLOQUEADAS */}
        {bloqueadas.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: '#55556A' }}>
              🔒 Bloqueadas ({bloqueadas.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {bloqueadas.map(c => (
                <div key={c.id} className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <div className="text-3xl mb-2 grayscale opacity-30">{c.icone ?? '🏆'}</div>
                  <p className="text-sm font-black font-racing leading-tight" style={{ color: '#2A2A3A' }}>{c.nome}</p>
                  {c.descricao && (
                    <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#2A2A3A' }}>{c.descricao}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3">
                    <Lock className="w-3 h-3" style={{ color: '#2A2A3A' }} />
                    {c.pontosRecompensa > 0 && (
                      <span className="text-[10px] font-racing" style={{ color: '#2A2A3A' }}>
                        +{c.pontosRecompensa} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RANKING */}
        {data.ranking.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: '#DC0000' }}>
              🏎️ Grid de Largada
            </p>
            <div className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,215,0,0.15)' }}>
              {data.ranking.map((r, i) => {
                const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                const nivelIdx = Math.min(r.nivel, NIVEL_LABELS.length - 1)
                const nivelLabel = NIVEL_LABELS[nivelIdx] || `Nível ${r.nivel}`
                const nivelColor = NIVEL_COLORS[nivelIdx] || '#9D4EDD'
                const isPodio = i < 3
                return (
                  <div key={r.operadorId}
                    className="flex items-center gap-3 px-4 py-3 transition-all"
                    style={{
                      background: r.isEu
                        ? 'rgba(220,0,0,0.1)'
                        : isPodio ? `${podiumColors[i]}06` : 'transparent',
                      borderBottom: i < data.ranking.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      borderLeft: r.isEu ? '3px solid #DC0000' : 'none',
                    }}>
                    {/* posição */}
                    <div className="w-8 flex-shrink-0 text-center">
                      {isPodio
                        ? <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                        : <span className="text-xs font-black font-racing" style={{ color: '#2A2A3A' }}>#{i + 1}</span>}
                    </div>

                    {/* nome + nível */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-racing truncate"
                        style={{ color: r.isEu ? '#FF4444' : isPodio ? podiumColors[i] : '#A0A0B8' }}>
                        {r.isEu ? `◀ ${r.nome.split(' ')[0]}` : r.nome.split(' ')[0]}
                      </p>
                      <p className="text-[10px] font-racing" style={{ color: nivelColor }}>{nivelLabel}</p>
                    </div>

                    {/* pontos */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Zap className="w-3 h-3" style={{ color: r.isEu ? '#DC0000' : '#55556A' }} />
                      <span className="text-sm font-black font-racing"
                        style={{ color: r.isEu ? '#FF4444' : '#A0A0B8' }}>
                        {(r.pontosAtuais ?? 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
