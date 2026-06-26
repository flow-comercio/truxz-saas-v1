import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Check, Star, ArrowRight, Smartphone, BarChart2,
  Users, Zap, Gauge, Wrench, Timer, Trophy, Flag, Fuel
} from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0A0A0F', fontFamily: 'Rajdhani, Nunito, sans-serif' }}>

      {/* ══ FUNDO GLOBAL ══════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Glow vermelho topo esquerdo */}
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #DC0000, transparent 70%)' }} />
        {/* Glow laranja direita */}
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #FF8700, transparent 70%)' }} />
        {/* Glow vermelho baixo */}
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #DC0000, transparent 70%)' }} />
        {/* Grid diagonal speed lines */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(rgba(220,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,0,0,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
      </div>

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(220,0,0,0.15)' }}>
        {/* faixa chequered */}
        <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-50" />
        <div className="absolute top-1 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 14px rgba(220,0,0,0.4)' }}>
              <img src="/logo-truxz.png" alt="TRUXZ" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black text-white text-lg font-display tracking-[0.15em]">TRUXZ</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-bold font-racing transition-colors hidden sm:block hover-red"
              style={{ color: '#55556A' }}>
              Entrar
            </Link>
            <Link href="/cadastrar"
              className="text-sm font-bold font-racing px-4 py-2 rounded-xl text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 16px rgba(220,0,0,0.35)' }}>
              Criar Box Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-28 px-4 overflow-hidden">

        {/* Speed lines diagonais no hero */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['-10%', '25%', '55%', '85%', '110%'].map((left, i) => (
            <div key={i} className="absolute top-0 bottom-0 opacity-[0.03]"
              style={{ left, width: '1px', background: 'linear-gradient(180deg, transparent, #DC0000 40%, #FF8700 60%, transparent)', transform: 'skewX(-20deg)' }} />
          ))}
        </div>

        {/* Chequered canto superior direito hero */}
        <div className="absolute top-20 right-0 w-48 h-48 opacity-[0.05] checkers-stripe pointer-events-none" />

        {/* Speedometer decorativo no fundo */}
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none hidden lg:block">
          <Gauge style={{ width: 480, height: 480, color: '#DC0000' }} />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">

          {/* Logo hero */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute w-28 h-28 rounded-full opacity-20 animate-ping"
              style={{ background: 'rgba(220,0,0,0.4)', animationDuration: '4s' }} />
            <div className="absolute w-24 h-24 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #DC0000, transparent)' }} />
            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #DC0000, #7A0000)', boxShadow: '0 0 60px rgba(220,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-30 carbon-bg" />
              <img src="/logo-truxz.png" alt="TRUXZ" className="relative w-14 h-14 object-contain" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(220,0,0,0.08)', border: '1px solid rgba(220,0,0,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-rpm" style={{ background: '#DC0000' }} />
            <span className="text-xs font-black font-racing uppercase tracking-[3px]" style={{ color: '#DC0000' }}>
              14 dias grátis · Pole Position
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 font-display tracking-wider leading-none">
            GESTÃO<br />
            <span style={{ background: 'linear-gradient(135deg, #DC0000, #FF8700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              AUTOMOTIVA
            </span><br />
            NO COCKPIT
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 font-racing" style={{ color: '#A0A0B8', lineHeight: 1.6 }}>
            Agendamento online, controle de equipe, financeiro e app para seus clientes.
            Tudo em um só pit lane.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/cadastrar"
              className="inline-flex items-center justify-center gap-2 font-black font-racing text-base px-8 py-4 rounded-xl text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 36px rgba(220,0,0,0.45)' }}>
              <Flag className="w-5 h-5" /> Ir para a Largada
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 font-bold font-racing text-base px-8 py-4 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#55556A', border: '1px solid rgba(255,255,255,0.08)' }}>
              Já tenho Box
            </Link>
          </div>

          <p className="text-sm font-racing" style={{ color: '#3A3A4A' }}>
            Seu box em{' '}
            <span className="font-bold" style={{ color: '#DC0000' }}>seubox.truxz.com.br</span>
            {' '}em menos de 2 minutos
          </p>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-12">
            {[
              { value: '2min',   label: 'para criar seu Box' },
              { value: '14d',    label: 'de trial grátis'    },
              { value: '100%',   label: 'sem cartão'         },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black font-display tracking-wide" style={{ color: '#DC0000' }}>{s.value}</p>
                <p className="text-[10px] font-racing uppercase tracking-wide mt-0.5" style={{ color: '#3A3A4A' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Linha divisória racing */}
      <div className="relative overflow-hidden h-2">
        <div className="absolute inset-0 checkers-stripe opacity-30" />
        <div className="absolute inset-y-0 left-0 right-0 h-px top-2"
          style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />
      </div>

      {/* ══ RECURSOS (PIT LANE) ═══════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(220,0,0,0.08)', border: '1px solid rgba(220,0,0,0.2)' }}>
              <Wrench className="w-3.5 h-3.5" style={{ color: '#DC0000' }} />
              <span className="text-xs font-black font-racing uppercase tracking-[3px]" style={{ color: '#DC0000' }}>
                Equipamentos do Box
              </span>
            </div>
            <h2 className="text-3xl font-black text-white font-display tracking-wider">
              Tudo que sua estética precisa
            </h2>
            <p className="mt-2 font-racing" style={{ color: '#55556A' }}>
              Do check-in ao pódio, em um só sistema.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Smartphone, color: '#FF8700',
                title: 'App para Pilotos',
                desc: 'Seus clientes agendam pelo celular sem ligar. App PWA com sua identidade.',
              },
              {
                icon: Timer, color: '#DC0000',
                title: 'Grid de Atendimento',
                desc: 'Fila de serviços ao vivo. Operadores veem a corrida em tempo real.',
              },
              {
                icon: Fuel, color: '#4ADE80',
                title: 'Financeiro do Pit',
                desc: 'Receita, ticket médio e comissões. Sabe exatamente o que entrou.',
              },
              {
                icon: Trophy, color: '#FFD700',
                title: 'Gamificação Racing',
                desc: 'Operadores sobem de Kart a F1. Ranking, XP e troféus de pódio.',
              },
              {
                icon: Gauge, color: '#60A5FA',
                title: 'Dashboard em Tempo Real',
                desc: 'Painel de controle com métricas do dia. Status da pista ao vivo.',
              },
              {
                icon: Wrench, color: '#C77DFF',
                title: 'OS e Orçamentos',
                desc: 'Ordens de serviço com checklist, assinatura digital e fotos.',
              },
              {
                icon: Users, color: '#F97316',
                title: 'Controle de Equipe',
                desc: 'Permissões por operador, metas e relatório de desempenho.',
              },
              {
                icon: Zap, color: '#DC0000',
                title: 'IA no Cockpit',
                desc: 'Assistente inteligente para o lojista e chat de atendimento ao cliente.',
              },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="feature-card relative p-5 rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${item.color}18` }}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.color}50, transparent)` }} />
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-1.5 font-racing">{item.title}</h3>
                  <p className="text-sm font-racing leading-relaxed" style={{ color: '#55556A' }}>{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ PLANOS / CATEGORIAS ═══════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* chequered corners */}
        <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-1 checkers-stripe opacity-20" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <Trophy className="w-3.5 h-3.5" style={{ color: '#FFD700' }} />
              <span className="text-xs font-black font-racing uppercase tracking-[3px]" style={{ color: '#FFD700' }}>
                Categorias
              </span>
            </div>
            <h2 className="text-3xl font-black text-white font-display tracking-wider">Escolha sua Categoria</h2>
            <p className="mt-2 font-racing" style={{ color: '#55556A' }}>Comece grátis. Cancele quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {[
              {
                nome: 'Kart',  emoji: '🏎️', cor: '#A0A0B8', destaque: false,
                preco: 'R$ 99,90',
                badge: 'Para começar',
                recursos: ['100 corridas/mês', '2 pilotos', 'App para clientes', 'Relatórios básicos'],
              },
              {
                nome: 'F1',   emoji: '🔴', cor: '#DC0000', destaque: true,
                preco: 'R$ 197,90',
                badge: 'Pole Position',
                recursos: ['500 corridas/mês', '5 pilotos', 'App para clientes', 'Relatórios completos', 'WhatsApp', 'IA no Cockpit'],
              },
              {
                nome: 'Le Mans', emoji: '🏆', cor: '#FFD700', destaque: false,
                preco: 'R$ 397,90',
                badge: 'Campeão',
                recursos: ['Ilimitado', '20 pilotos', 'App para clientes', 'Relatórios + IA', 'WhatsApp + PIX auto'],
              },
            ].map(plano => (
              <div key={plano.nome}
                className={`relative rounded-2xl p-6 overflow-hidden ${plano.destaque ? 'scale-105 z-10' : ''}`}
                style={{
                  background: plano.destaque
                    ? `linear-gradient(135deg, rgba(220,0,0,0.18), rgba(100,0,0,0.12))`
                    : 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(20px)',
                  border: `${plano.destaque ? '2px' : '1px'} solid ${plano.cor}${plano.destaque ? '60' : '20'}`,
                  boxShadow: plano.destaque ? `0 0 50px rgba(220,0,0,0.18)` : 'none',
                }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${plano.cor}${plano.destaque ? 'CC' : '50'}, transparent)` }} />

                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{plano.emoji}</span>
                  <span className="text-[10px] font-black font-racing px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: `${plano.cor}15`, color: plano.cor, border: `1px solid ${plano.cor}35` }}>
                    {plano.badge}
                  </span>
                </div>

                <h3 className="font-black text-white text-xl mb-0.5 font-display tracking-widest">{plano.nome}</h3>
                <p className="text-3xl font-black my-4 font-racing" style={{ color: plano.destaque ? plano.cor : '#fff' }}>
                  {plano.preco}
                  <span className="text-sm font-normal ml-1" style={{ color: '#3A3A4A' }}>/mês</span>
                </p>

                <ul className="space-y-2 mb-6">
                  {plano.recursos.map(r => (
                    <li key={r} className="flex items-center gap-2 text-sm font-racing" style={{ color: '#A0A0B8' }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plano.cor }} />
                      {r}
                    </li>
                  ))}
                </ul>

                <Link href="/cadastrar"
                  className="block text-center py-3 rounded-xl font-bold font-racing text-sm text-white transition-all"
                  style={{
                    background: plano.destaque
                      ? `linear-gradient(135deg, ${plano.cor}, #A00000)`
                      : `${plano.cor}18`,
                    border: plano.destaque ? 'none' : `1px solid ${plano.cor}30`,
                    boxShadow: plano.destaque ? `0 0 22px rgba(220,0,0,0.35)` : 'none',
                  }}>
                  Começar grátis →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DEPOIMENTOS ══════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <Star className="w-3.5 h-3.5 fill-amber-400" style={{ color: '#FBBF24' }} />
              <span className="text-xs font-black font-racing uppercase tracking-[3px]" style={{ color: '#FBBF24' }}>
                Pódio dos Clientes
              </span>
            </div>
            <h2 className="text-3xl font-black text-white font-display tracking-wider">
              O que dizem os Pilotos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { nome: 'Carlos M.', loja: 'Auto Brilho SP',   posicao: '🥇', texto: 'Reduziu 80% das ligações. Clientes adoram agendar pelo app.' },
              { nome: 'Ana R.',    loja: 'Prime Detail',     posicao: '🥈', texto: 'O controle financeiro é incrível. Sei exatamente quanto entrou.' },
              { nome: 'João P.',   loja: 'Detailing Master', posicao: '🥉', texto: 'Em 2 minutos minha loja estava no ar. Muito fácil de usar.' },
            ].map((d, i) => (
              <div key={d.nome} className="relative p-5 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.25), transparent)' }} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" style={{ color: '#FBBF24' }} />
                    ))}
                  </div>
                  <span className="text-xl">{d.posicao}</span>
                </div>

                <p className="text-sm font-racing mb-4 leading-relaxed" style={{ color: '#A0A0B8' }}>
                  "{d.texto}"
                </p>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs font-racing"
                    style={{ background: 'rgba(220,0,0,0.12)', border: '1px solid rgba(220,0,0,0.2)', color: '#DC0000' }}>
                    {d.nome[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm font-racing">{d.nome}</p>
                    <p className="text-[10px] font-racing" style={{ color: '#3A3A4A' }}>{d.loja}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════════════ */}
      <section className="py-28 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative inline-block rounded-3xl p-10 w-full overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(220,0,0,0.12), rgba(100,0,0,0.08))',
              border: '1px solid rgba(220,0,0,0.25)',
              boxShadow: '0 0 80px rgba(220,0,0,0.08)',
            }}>
            {/* chequered topo */}
            <div className="absolute top-0 left-0 right-0 h-2 checkers-stripe opacity-40" />
            <div className="absolute top-2 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />

            {/* Speedlines laterais */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {['10%', '90%'].map((left, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px opacity-[0.06]"
                  style={{ left, background: 'linear-gradient(180deg, transparent, #DC0000, transparent)' }} />
              ))}
            </div>

            {/* Logo */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-20 h-20 rounded-full opacity-20 animate-ping"
                style={{ background: 'rgba(220,0,0,0.5)', animationDuration: '3s' }} />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #DC0000, #7A0000)', boxShadow: '0 0 40px rgba(220,0,0,0.5)' }}>
                <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-30 carbon-bg" />
                <img src="/logo-truxz.png" alt="TRUXZ" className="relative w-10 h-10 object-contain" />
              </div>
            </div>

            <p className="text-[10px] font-bold font-racing uppercase tracking-[4px] mb-2" style={{ color: '#DC0000' }}>
              Bandeira Verde
            </p>
            <h2 className="text-4xl font-black text-white mb-3 font-display tracking-wider">Pronto para Largar?</h2>
            <p className="mb-8 font-racing" style={{ color: '#A0A0B8' }}>
              Crie seu box agora e comece a receber agendamentos hoje. 14 dias grátis.
            </p>

            <Link href="/cadastrar"
              className="inline-flex items-center gap-2.5 font-black font-racing px-10 py-4 rounded-xl text-white text-base transition-all"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 40px rgba(220,0,0,0.5)' }}>
              <Flag className="w-5 h-5" /> Ir para a Largada <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-5 text-xs font-racing" style={{ color: '#3A3A4A' }}>
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer className="relative py-8 px-4 overflow-hidden"
        style={{ borderTop: '1px solid rgba(220,0,0,0.1)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-20" />

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(220,0,0,0.15)', border: '1px solid rgba(220,0,0,0.2)' }}>
              <img src="/logo-truxz.png" alt="TRUXZ" className="w-4 h-4 object-contain opacity-60" />
            </div>
            <span className="font-black text-xs font-display tracking-widest" style={{ color: '#2A2A3A' }}>TRUXZ</span>
          </div>

          <p className="text-xs font-racing" style={{ color: '#2A2A3A' }}>
            © {new Date().getFullYear()} TRUXZ · Motorsport Management · Todos os direitos reservados
          </p>

          <div className="flex gap-6 text-xs font-racing">
            <Link href="/login" className="hover-red transition-colors" style={{ color: '#2A2A3A' }}>
              Login
            </Link>
            <Link href="/cadastrar" className="hover-red transition-colors" style={{ color: '#2A2A3A' }}>
              Cadastrar
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
