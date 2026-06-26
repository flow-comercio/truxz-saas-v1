'use client'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Trophy, Zap, Target, Flag, Flame, Fuel, Wrench, Award, Timer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  xp: { pontosAtuais: number; nivel: number; progressoNivel: number; pontosProxNivel: number; streakDias: number; totalHistorico: number }
  metricas: { osMes: number; agMes: number; receitaMes: number }
  metas: { id: string; tipo: string; valorMeta: string; valorAtual: number; percentual: number }[]
  comissoes: { mes: number; pendente: number }
  badges: { codigo: string; nome: string; icone: string | null; cor: string | null }[]
  ranking: { operadorId: string; pontosAtuais: number; nivel: number; posicao: number; isEu: boolean }[]
  ultimosEventos: { tipo: string; pontos: number; descricao: string | null; criadoEm: string }[]
}

// Categorias reais do motorsport como sistema de progressão
const NIVEL_LABELS  = ['', 'Kart', 'F3', 'F2', 'F1', 'Lenda', 'CAMPEÃO']
const NIVEL_COLORS  = ['', '#A0A0B8', '#4ADE80', '#60A5FA', '#DC0000', '#FFD700', '#FFD700']
const NIVEL_GLOWS   = ['', 'rgba(160,160,184,0.3)', 'rgba(74,222,128,0.35)', 'rgba(96,165,250,0.35)', 'rgba(220,0,0,0.45)', 'rgba(255,215,0,0.45)', 'rgba(255,215,0,0.45)']

// Ícone por nível motorsport
const NIVEL_ICONS = ['', '🏎️', '🏁', '🔵', '🔴', '🏆', '👑']

function RacingProgressBar({ value, color = '#DC0000' }: { value: number; color?: string }) {
  return (
    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      {/* segmentos estilo RPM */}
      <div className="absolute inset-0 flex gap-0.5 px-0.5 items-center">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-sm transition-all duration-500"
            style={{
              background: i < Math.floor(value / 5)
                ? i < 14 ? color : '#FFD700'
                : 'rgba(255,255,255,0.05)',
            }} />
        ))}
      </div>
    </div>
  )
}

function CircularProgress({ value, color, size = 64, label }: { value: number; color: string; size?: number; label: string }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
      </svg>
      <span className="text-[10px] font-bold font-racing uppercase tracking-wide" style={{ color }}>{label}</span>
    </div>
  )
}

export default function OperacionalDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['gamificacao-dashboard'],
    queryFn: () => fetch('/api/gamificacao/meu-dashboard').then(r => r.json()),
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#DC0000' }} />
        <p className="text-xs font-racing tracking-widest uppercase" style={{ color: '#55556A' }}>Preparando o Carro...</p>
      </div>
    </div>
  )

  if (!data || 'error' in data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <p style={{ color: '#A0A0B8' }}>Perfil de piloto não encontrado.</p>
    </div>
  )

  const nivelIdx  = Math.min(data.xp.nivel, NIVEL_LABELS.length - 1)
  const nivelLabel = NIVEL_LABELS[nivelIdx] || `Nível ${data.xp.nivel}`
  const nivelColor = NIVEL_COLORS[nivelIdx] || '#9D4EDD'
  const nivelGlow  = NIVEL_GLOWS[nivelIdx]  || 'rgba(157,78,221,0.3)'
  const nivelIcon  = NIVEL_ICONS[nivelIdx]  || '🏎️'
  const isLegenda  = data.xp.nivel >= 5

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0A0A0F' }}>

      {/* ── HERO COCKPIT ────────────────────────── */}
      <div className="relative overflow-hidden carbon-bg"
        style={{ borderBottom: '1px solid rgba(220,0,0,0.2)' }}>

        {/* faixa chequered topo */}
        <div className="absolute top-0 left-0 right-0 h-2 checkers-stripe" />

        {/* linha acento vermelha */}
        <div className="absolute top-2 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 20%, #FF8700 80%, transparent)' }} />

        {/* speed lines decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[15, 35, 55, 75, 90].map((left, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px opacity-5"
              style={{ left: `${left}%`, background: 'linear-gradient(180deg, transparent, #DC0000, transparent)' }} />
          ))}
        </div>

        <div className="relative p-5 pt-8">
          {/* Nível + ícone */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: nivelColor }}>
                Categoria · Piloto
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{nivelIcon}</span>
                <h1 className={`text-4xl font-black text-white font-display tracking-widest ${isLegenda ? 'shine-text' : ''}`}
                  style={isLegenda ? {} : { color: nivelColor }}>
                  {nivelLabel}
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${nivelColor}22, ${nivelColor}08)`, border: `2px solid ${nivelColor}`, boxShadow: `0 0 28px ${nivelGlow}` }}>
                <span className="text-3xl">{nivelIcon}</span>
              </div>
              {data.xp.streakDias > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <Flame className="w-3 h-3" style={{ color: '#F97316' }} />
                  <span className="text-[10px] font-bold font-racing" style={{ color: '#F97316' }}>
                    {data.xp.streakDias}d Streak
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Barra RPM de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-racing">
              <span style={{ color: '#A0A0B8' }}>{data.xp.totalHistorico.toLocaleString('pt-BR')} pts corrida</span>
              <span style={{ color: nivelColor }}>{data.xp.pontosProxNivel} pts → próxima categoria</span>
            </div>
            <RacingProgressBar value={data.xp.progressoNivel} color={nivelColor} />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-racing uppercase tracking-widest" style={{ color: '#55556A' }}>RPM</span>
              <span className="text-sm font-black font-racing" style={{ color: nivelColor }}>{data.xp.progressoNivel}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── MÉTRICAS DO MÊS ─────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'OS do Mês',  value: data.metricas.osMes,                    icon: Wrench,  color: '#DC0000' },
            { label: 'Agendadas',  value: data.metricas.agMes,                     icon: Timer,   color: '#4ADE80' },
            { label: 'Faturado',   value: formatCurrency(data.metricas.receitaMes), icon: Fuel,    color: '#60A5FA' },
          ].map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} className="p-3.5 rounded-2xl text-center"
                style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <p className="text-lg font-black font-racing text-white leading-tight">{m.value}</p>
                <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: '#55556A' }}>{m.label}</p>
              </div>
            )
          })}
        </div>

        {/* ── COMISSÕES ───────────────────────────── */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.18)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="w-4 h-4" style={{ color: '#4ADE80' }} />
            <p className="font-bold text-white text-sm font-display tracking-wider">Meu Cofre</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-racing" style={{ color: '#55556A' }}>Este mês</p>
              <p className="text-2xl font-black font-racing" style={{ color: '#4ADE80' }}>{formatCurrency(data.comissoes.mes)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-racing" style={{ color: '#55556A' }}>A receber</p>
              <p className="text-2xl font-black font-racing" style={{ color: '#FBBF24' }}>{formatCurrency(data.comissoes.pendente)}</p>
            </div>
          </div>
        </div>

        {/* ── METAS DA TEMPORADA ──────────────────── */}
        {data.metas.length > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(220,0,0,0.18)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4" style={{ color: '#DC0000' }} />
              <p className="font-bold text-white text-sm font-display tracking-wider">Metas da Temporada</p>
            </div>
            <div className="space-y-4">
              {data.metas.map(m => {
                const cor = m.percentual >= 100 ? '#4ADE80' : m.percentual >= 70 ? '#DC0000' : m.percentual >= 40 ? '#FBBF24' : '#F87171'
                const tipoLabel: Record<string, string> = {
                  os_concluidas: 'OS Concluídas', agendamentos: 'Agendamentos',
                  receita: 'Receita', nota_media: 'Nota Média', produtos_vendidos: 'Produtos Vendidos'
                }
                const valorFormatado = m.tipo === 'receita'
                  ? `${formatCurrency(m.valorAtual)} / ${formatCurrency(parseFloat(m.valorMeta))}`
                  : `${m.valorAtual} / ${m.valorMeta}`
                return (
                  <div key={m.id}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold font-racing text-white">{tipoLabel[m.tipo] || m.tipo}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-racing" style={{ color: '#A0A0B8' }}>{valorFormatado}</span>
                        <span className="text-sm font-black font-racing" style={{ color: cor }}>{m.percentual}%</span>
                      </div>
                    </div>
                    <RacingProgressBar value={m.percentual} color={cor} />
                    {m.percentual >= 100 && (
                      <p className="text-xs mt-1 font-bold font-racing" style={{ color: '#4ADE80' }}>🏁 Volta rápida! +200 pts</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── RANKING DO GRID ─────────────────────── */}
        {data.ranking.length > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
              <p className="font-bold text-white text-sm font-display tracking-wider">Grid de Largada</p>
            </div>
            <div className="space-y-2">
              {data.ranking.map((r, i) => {
                const pos = i + 1
                const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                const podiumLabels = ['P1 · POLE', 'P2', 'P3']
                const isPodio = pos <= 3
                return (
                  <div key={r.operadorId}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: r.isEu
                        ? 'rgba(220,0,0,0.1)'
                        : isPodio ? `${podiumColors[i]}08` : 'rgba(255,255,255,0.02)',
                      border: r.isEu
                        ? '1px solid rgba(220,0,0,0.35)'
                        : isPodio ? `1px solid ${podiumColors[i]}30` : '1px solid rgba(255,255,255,0.04)',
                    }}>
                    <div className="w-8 text-center">
                      {isPodio
                        ? <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                        : <span className="text-xs font-black font-racing" style={{ color: '#55556A' }}>#{pos}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold font-racing"
                        style={{ color: r.isEu ? '#FF4444' : isPodio ? podiumColors[i] : '#A0A0B8' }}>
                        {r.isEu ? '◀ VOCÊ' : `Nível ${NIVEL_LABELS[Math.min(r.nivel, NIVEL_LABELS.length - 1)] || r.nivel}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
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

        {/* ── TROFÉUS / CONQUISTAS ─────────────────── */}
        {data.badges.length > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.12)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4" style={{ color: '#FFD700' }} />
              <p className="font-bold text-white text-sm font-display tracking-wider">Sala de Troféus</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.badges.map(b => (
                <div key={b.codigo} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${b.cor ?? '#FFD700'}10`, border: `1px solid ${b.cor ?? '#FFD700'}35` }}>
                  <span className="text-base">{b.icone ?? '🏆'}</span>
                  <span className="text-xs font-bold font-racing text-white">{b.nome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÚLTIMAS VOLTAS (atividades) ─────────── */}
        {data.ultimosEventos.length > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4" style={{ color: '#55556A' }} />
              <p className="font-bold text-white text-sm font-display tracking-wider">Últimas Voltas</p>
            </div>
            <div className="space-y-2.5">
              {data.ultimosEventos.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#DC0000' }} />
                    <p className="text-sm font-racing" style={{ color: '#A0A0B8' }}>{e.descricao ?? e.tipo}</p>
                  </div>
                  <span className="text-sm font-black font-racing flex-shrink-0" style={{ color: '#DC0000' }}>
                    +{e.pontos} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
