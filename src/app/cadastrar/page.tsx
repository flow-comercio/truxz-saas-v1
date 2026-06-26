'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Check, ChevronRight, ChevronLeft,
  Loader2, Wrench, User, Flag, Eye, EyeOff, Trophy, Store, Gauge
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Plano {
  id: string; nome: string; tipo: string; preco: string; descricao: string | null
  limiteAgendamentosMes: number; limiteOperadores: number
  permiteRelatorios: boolean; permiteWhatsapp: boolean; permiteIA: boolean
}

// Cores por categoria de plano (metáfora motorsport)
const PLANO_COLOR: Record<string, string> = {
  basico:        '#A0A0B8',   // prata – Kart
  profissional:  '#DC0000',   // vermelho F1 – pole position
  premium:       '#FFD700',   // ouro – campeão
}
const PLANO_GLOW: Record<string, string> = {
  basico:       'rgba(160,160,184,0.15)',
  profissional: 'rgba(220,0,0,0.25)',
  premium:      'rgba(255,215,0,0.25)',
}
const PLANO_BADGE: Record<string, string> = {
  basico: 'Kart', profissional: 'Pole Position', premium: 'Le Mans'
}
const PLANO_ICON: Record<string, string> = {
  basico: '🏎️', profissional: '🔴', premium: '🏆'
}

// Steps com linguagem motorsport
const STEPS = [
  { label: 'Categoria', icon: Trophy },
  { label: 'Box',       icon: Store  },
  { label: 'Piloto',    icon: User   },
  { label: 'Largada',   icon: Flag   },
]

export default function CadastrarPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [planoSelecionado, setPlano] = useState<Plano | null>(null)
  const [showSenha, setShowSenha] = useState(false)
  const [concluido, setConcluido] = useState<any>(null)

  const [loja, setLoja]   = useState({ nomeLoja: '', email: '', telefone: '', cidade: '', estado: '' })
  const [admin, setAdmin] = useState({ adminNome: '', adminEmail: '', adminSenha: '' })

  const { data: planos = [], isLoading: carregandoPlanos } = useQuery<Plano[]>({
    queryKey: ['planos-publicos'],
    queryFn: () => fetch('/api/public/planos').then(r => r.json()),
  })

  const cadastrarMutation = useMutation({
    mutationFn: () =>
      fetch('/api/public/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loja, ...admin, planoId: planoSelecionado?.id, metodoPagamento: 'trial' }),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro ao criar loja')
        return json
      }),
    onSuccess: (data) => {
      if (data.verificacaoPendente) {
        router.push(`/login/verificar-email?email=${encodeURIComponent(admin.adminEmail)}`)
      } else {
        setConcluido(data.loja)
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function next() { setStep(s => Math.min(s + 1, 3)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  const stepValido = [
    !!planoSelecionado,
    !!loja.nomeLoja && !!loja.email,
    !!admin.adminNome && !!admin.adminEmail && admin.adminSenha.length >= 6,
    true,
  ]

  /* ── TELA DE SUCESSO ─────────────────────────── */
  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: '#0A0A0F' }}>
        <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-60" />
        <div className="absolute top-1 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

        <div className="relative rounded-2xl overflow-hidden p-8 max-w-md w-full text-center z-10"
          style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(24px)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #4ADE80, transparent)' }} />

          {/* Troféu animado */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-24 h-24 rounded-full opacity-20 animate-ping"
              style={{ background: 'rgba(74,222,128,0.3)', animationDuration: '2s' }} />
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)' }}>
              <span className="text-4xl">🏁</span>
            </div>
          </div>

          <p className="text-[10px] font-bold font-racing uppercase tracking-[4px] mb-1" style={{ color: '#4ADE80' }}>
            Bandeirada!
          </p>
          <h1 className="text-3xl font-black text-white font-display tracking-widest mb-2">Box Criado!</h1>
          <p className="text-sm mb-6 font-racing" style={{ color: '#A0A0B8' }}>
            Você tem <strong className="text-white">14 dias grátis</strong> para explorar tudo. Sem cartão.
          </p>

          <div className="rounded-xl p-4 text-left space-y-2.5 mb-6 text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex justify-between items-center">
              <span className="font-racing uppercase text-[10px] tracking-wider" style={{ color: '#55556A' }}>Loja pública</span>
              <a href={concluido.linkPublico} className="font-semibold font-racing text-xs truncate ml-2" style={{ color: '#DC0000' }}>
                {concluido.linkPublico}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-racing uppercase text-[10px] tracking-wider" style={{ color: '#55556A' }}>Seu painel</span>
              <a href={concluido.linkAdmin} className="font-semibold font-racing text-xs" style={{ color: '#FF8700' }}>
                Abrir painel →
              </a>
            </div>
          </div>

          <a href={concluido.linkAdmin} className="btn-racing w-full justify-center flex items-center gap-2">
            <Flag className="w-4 h-4" /> Entrar no Cockpit agora
          </a>
        </div>
      </div>
    )
  }

  /* ── PÁGINA PRINCIPAL ────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0A0A0F' }}>

      {/* Fundo motorsport (mesmo do login) */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(220,0,0,0.05) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['-20', '10', '40', '70', '100'].map((left, i) => (
          <div key={i} className="absolute top-0 bottom-0 opacity-[0.02]"
            style={{ left: `${left}%`, width: '1px', background: 'linear-gradient(180deg, transparent, #DC0000 50%, transparent)', transform: 'skewX(-15deg)' }} />
        ))}
      </div>
      <div className="absolute top-0 left-0 w-40 h-40 opacity-[0.04] pointer-events-none checkers-stripe" />
      <div className="absolute bottom-0 right-0 w-56 h-28 opacity-[0.04] pointer-events-none checkers-stripe" />
      <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-50 pointer-events-none" />
      <div className="absolute top-1 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

      <div className="w-full max-w-lg relative z-10">

        {/* ── LOGO ───────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(220,0,0,0.1)', border: '1px solid rgba(220,0,0,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-rpm" style={{ background: '#DC0000' }} />
            <span className="text-[10px] font-bold font-racing uppercase tracking-[3px]" style={{ color: '#DC0000' }}>
              Novo Box
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 20px rgba(220,0,0,0.4)' }}>
              <img src="/logo-truxz.png" alt="TRUXZ" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white font-display tracking-[0.18em]">TRUXZ</h1>
          </div>
          <p className="text-xs font-racing uppercase tracking-[2px]" style={{ color: '#55556A' }}>
            14 dias grátis · Sem cartão de crédito
          </p>
        </div>

        {/* ── CARD PRINCIPAL ─────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(24px)', border: '1px solid rgba(220,0,0,0.18)' }}>

          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #DC0000 40%, #FF8700 60%, transparent)' }} />
          <div className="absolute top-0 left-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(220,0,0,0.35), transparent)' }} />

          {/* ── PROGRESS STEPS ─────────────────────── */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon
                const done    = i < step
                const active  = i === step
                return (
                  <div key={s.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: done   ? 'rgba(74,222,128,0.15)'
                                    : active ? 'linear-gradient(135deg, #DC0000, #A00000)'
                                    :           'rgba(255,255,255,0.04)',
                          border: done   ? '1px solid rgba(74,222,128,0.4)'
                                : active ? 'none'
                                :           '1px solid rgba(255,255,255,0.07)',
                          boxShadow: active ? '0 0 16px rgba(220,0,0,0.4)' : 'none',
                        }}>
                        {done
                          ? <Check className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                          : <StepIcon className="w-3.5 h-3.5"
                              style={{ color: active ? '#fff' : '#2A2A3A' }} />}
                      </div>
                      <span className="text-[9px] font-bold font-racing uppercase tracking-wide hidden sm:block"
                        style={{ color: done ? '#4ADE80' : active ? '#FF4444' : '#2A2A3A' }}>
                        {s.label}
                      </span>
                    </div>

                    {i < STEPS.length - 1 && (
                      <div className="flex-1 mx-1.5 mb-3">
                        <div className="h-px transition-all duration-500"
                          style={{ background: done ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.05)' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="px-6 pb-6">

            {/* ── STEP 0: ESCOLHER PLANO / CATEGORIA ── */}
            {step === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4" style={{ color: '#DC0000' }} />
                  <h2 className="font-bold text-white font-display tracking-wider">Escolha sua Categoria</h2>
                </div>

                {carregandoPlanos ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#DC0000' }} />
                    <p className="text-xs font-racing" style={{ color: '#55556A' }}>Carregando categorias...</p>
                  </div>
                ) : planos.map(p => {
                  const cor      = PLANO_COLOR[p.tipo]  ?? '#A0A0B8'
                  const glow     = PLANO_GLOW[p.tipo]   ?? 'rgba(160,160,184,0.1)'
                  const badge    = PLANO_BADGE[p.tipo]  ?? p.tipo
                  const icon     = PLANO_ICON[p.tipo]   ?? '🏎️'
                  const selected = planoSelecionado?.id === p.id
                  return (
                    <button key={p.id} onClick={() => setPlano(p)}
                      className="w-full text-left p-4 rounded-xl transition-all"
                      style={{
                        background: selected ? `${cor}10` : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${selected ? cor : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: selected ? `0 0 24px ${glow}` : 'none',
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* ícone da categoria */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                            style={{ background: `${cor}12`, border: `1px solid ${cor}30` }}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="font-bold text-white font-racing">{p.nome}</p>
                              <span className="text-[9px] font-bold font-racing px-2 py-0.5 rounded-full uppercase tracking-wide"
                                style={{ background: `${cor}15`, color: cor, border: `1px solid ${cor}35` }}>
                                {badge}
                              </span>
                            </div>
                            {p.descricao && (
                              <p className="text-xs font-racing mb-1.5" style={{ color: '#A0A0B8' }}>{p.descricao}</p>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>✓ {p.limiteAgendamentosMes} corridas/mês</span>
                              <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>✓ {p.limiteOperadores} pilotos</span>
                              {p.permiteRelatorios && <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>✓ Relatórios</span>}
                              {p.permiteWhatsapp   && <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>✓ WhatsApp</span>}
                              {p.permiteIA         && <span className="text-[10px] font-racing" style={{ color: '#55556A' }}>✓ IA Piloto</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-lg font-racing" style={{ color: cor }}>
                            {formatCurrency(parseFloat(p.preco))}
                          </p>
                          <p className="text-[10px] font-racing" style={{ color: '#55556A' }}>/mês</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── STEP 1: DADOS DO BOX (LOJA) ─────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="w-4 h-4" style={{ color: '#DC0000' }} />
                  <h2 className="font-bold text-white font-display tracking-wider">Dados do Seu Box</h2>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    Nome do Box *
                  </label>
                  <input className="input-racing" placeholder="Ex: TRUXZ Centro" value={loja.nomeLoja}
                    onChange={e => setLoja(f => ({ ...f, nomeLoja: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    Email de contato *
                  </label>
                  <input type="email" className="input-racing" placeholder="contato@minhaloja.com" value={loja.email}
                    onChange={e => setLoja(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    WhatsApp / Telefone
                  </label>
                  <input className="input-racing" placeholder="(11) 99999-9999" value={loja.telefone}
                    onChange={e => setLoja(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                      Cidade
                    </label>
                    <input className="input-racing" placeholder="São Paulo" value={loja.cidade}
                      onChange={e => setLoja(f => ({ ...f, cidade: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                      Estado
                    </label>
                    <input className="input-racing" placeholder="SP" maxLength={2}
                      value={loja.estado}
                      onChange={e => setLoja(f => ({ ...f, estado: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: DADOS DO PILOTO (ADMIN) ─── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4" style={{ color: '#DC0000' }} />
                  <h2 className="font-bold text-white font-display tracking-wider">Dados do Piloto</h2>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    Seu nome *
                  </label>
                  <input className="input-racing" placeholder="Nome completo" value={admin.adminNome}
                    onChange={e => setAdmin(f => ({ ...f, adminNome: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    Email de login *
                  </label>
                  <input type="email" className="input-racing" placeholder="seu@email.com" value={admin.adminEmail}
                    onChange={e => setAdmin(f => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing" style={{ color: '#55556A' }}>
                    Senha *
                  </label>
                  <div className="relative">
                    <input type={showSenha ? 'text' : 'password'} className="input-racing pr-10"
                      placeholder="Mínimo 6 caracteres" value={admin.adminSenha}
                      onChange={e => setAdmin(f => ({ ...f, adminSenha: e.target.value }))} />
                    <button type="button" onClick={() => setShowSenha(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#55556A' }}>
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: LARGADA / CONFIRMAÇÃO ────── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-4 h-4" style={{ color: '#DC0000' }} />
                  <h2 className="font-bold text-white font-display tracking-wider">Revisar e ir para Largada</h2>
                </div>

                {/* Resumo */}
                <div className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-4 py-2.5 text-[10px] font-bold font-racing uppercase tracking-[2px]"
                    style={{ color: '#55556A', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    Briefing do Box
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    {[
                      { label: 'Categoria', value: `${planoSelecionado?.nome} · ${formatCurrency(parseFloat(planoSelecionado?.preco ?? '0'))}/mês` },
                      { label: 'Nome do Box', value: loja.nomeLoja },
                      { label: 'Piloto', value: admin.adminNome },
                      { label: 'Email', value: admin.adminEmail },
                      ...(loja.cidade ? [{ label: 'Cidade', value: `${loja.cidade}/${loja.estado}` }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center gap-3">
                        <span className="font-racing uppercase text-[10px] tracking-wider flex-shrink-0" style={{ color: '#55556A' }}>
                          {row.label}
                        </span>
                        <span className="font-semibold font-racing text-sm text-right truncate" style={{ color: '#A0A0B8' }}>
                          {row.value}
                        </span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="font-bold font-racing text-white">Cobrado hoje</span>
                      <span className="font-black text-lg font-racing" style={{ color: '#4ADE80' }}>R$ 0,00</span>
                    </div>
                  </div>
                </div>

                {/* Banner trial */}
                <div className="rounded-xl p-3.5 flex items-start gap-3"
                  style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <span className="text-xl flex-shrink-0">🏁</span>
                  <div>
                    <p className="text-sm font-bold font-racing" style={{ color: '#4ADE80' }}>
                      14 dias grátis na pole position
                    </p>
                    <p className="text-xs font-racing mt-0.5" style={{ color: '#55556A' }}>
                      Sem cartão de crédito. Após o trial você escolhe como continuar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── NAVEGAÇÃO ──────────────────────── */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={back}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold font-racing text-sm transition-all flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#55556A' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {step < 3 ? (
                <button onClick={next} disabled={!stepValido[step]}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold font-racing text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: stepValido[step] ? 'linear-gradient(135deg, #DC0000, #A00000)' : 'rgba(220,0,0,0.3)',
                    boxShadow: stepValido[step] ? '0 0 20px rgba(220,0,0,0.3)' : 'none',
                  }}>
                  Próxima Volta <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => cadastrarMutation.mutate()} disabled={cadastrarMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold font-racing text-sm text-white transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #DC0000, #A00000)',
                    boxShadow: cadastrarMutation.isPending ? 'none' : '0 0 24px rgba(220,0,0,0.4)',
                  }}>
                  {cadastrarMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando seu Box...</>
                    : <><Flag className="w-4 h-4" /> Ir para Largada!</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs mt-4 font-racing" style={{ color: '#2A2A3A' }}>
          Já tem acesso?{' '}
          <Link href="/login" className="font-bold transition-colors" style={{ color: '#DC0000' }}>
            Entrar no Cockpit
          </Link>
        </p>
      </div>
    </div>
  )
}
