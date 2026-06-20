import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, ArrowRight, Smartphone, BarChart2, Users, Zap } from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-black">
      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-7" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/cadastrar"
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-16 lg:h-20 mx-auto mb-8" />

          <span className="inline-block bg-orange-600/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest border border-orange-600/30">
            14 dias grátis · Sem cartão de crédito
          </span>

          <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-6">
            Gestão completa para<br />
            <span className="text-orange-500">estéticas automotivas</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            Agendamento online, controle de equipe, financeiro e app para seus clientes.
            Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastrar"
              className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors"
            >
              Criar minha loja grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors border border-white/10"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-sm text-gray-600 mt-5">
            Sua loja em <span className="text-gray-400 font-mono">sualoja.truxz.com.br</span> em menos de 2 minutos
          </p>
        </div>
      </section>

      {/* ── RECURSOS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Tudo que sua estética precisa
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Smartphone, title: 'App para clientes',   desc: 'Seus clientes agendam pelo celular, sem ligações.' },
              { icon: Users,      title: 'Controle de equipe',  desc: 'Fila de atendimento e operadores em tempo real.' },
              { icon: BarChart2,  title: 'Relatórios',          desc: 'Receita, ticket médio e serviços mais populares.' },
              { icon: Zap,        title: 'Pagamento via PIX',   desc: 'Integração com Asaas para cobranças automáticas.' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Planos e preços</h2>
          <p className="text-gray-500 text-center mb-12">Comece grátis. Cancele quando quiser.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                nome: 'Básico', preco: 'R$ 99,90', destaque: false,
                recursos: ['100 agendamentos/mês', '2 operadores', 'App para clientes', 'Relatórios básicos'],
              },
              {
                nome: 'Profissional', preco: 'R$ 197,90', destaque: true,
                recursos: ['500 agendamentos/mês', '5 operadores', 'App para clientes', 'Relatórios completos', 'WhatsApp'],
              },
              {
                nome: 'Premium', preco: 'R$ 397,90', destaque: false,
                recursos: ['Ilimitado', '20 operadores', 'App para clientes', 'Relatórios + IA', 'WhatsApp + PIX auto'],
              },
            ].map(plano => (
              <div key={plano.nome} className={`rounded-2xl p-6 border ${
                plano.destaque
                  ? 'bg-orange-600 border-orange-500 scale-105'
                  : 'bg-white/5 border-white/10'
              }`}>
                {plano.destaque && (
                  <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    Mais popular
                  </span>
                )}
                <h3 className={`font-bold text-lg ${plano.destaque ? 'text-white' : 'text-white'}`}>{plano.nome}</h3>
                <p className={`text-3xl font-black my-3 ${plano.destaque ? 'text-white' : 'text-white'}`}>
                  {plano.preco}
                  <span className={`text-sm font-normal ${plano.destaque ? 'text-white/70' : 'text-gray-500'}`}>/mês</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {plano.recursos.map(r => (
                    <li key={r} className={`flex items-center gap-2 text-sm ${plano.destaque ? 'text-white/90' : 'text-gray-400'}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${plano.destaque ? 'text-white' : 'text-orange-500'}`} />
                      {r}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar" className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  plano.destaque
                    ? 'bg-white text-orange-600 hover:bg-orange-50'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}>
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nome: 'Carlos M.', loja: 'Auto Brilho SP',   texto: 'Reduziu 80% das ligações. Clientes adoram agendar pelo app.' },
              { nome: 'Ana R.',    loja: 'Prime Detail',     texto: 'O controle financeiro é incrível. Sei exatamente quanto entrou.' },
              { nome: 'João P.',   loja: 'Detailing Master', texto: 'Em 2 minutos minha loja estava no ar. Muito fácil de usar.' },
            ].map(d => (
              <div key={d.nome} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 mb-4">"{d.texto}"</p>
                <p className="font-semibold text-white text-sm">{d.nome}</p>
                <p className="text-xs text-gray-500">{d.loja}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-10 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-black text-white mb-4">Pronto para começar?</h2>
          <p className="text-gray-400 mb-8">Crie sua loja agora e comece a receber agendamentos hoje.</p>
          <Link href="/cadastrar"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
          >
            Criar minha loja grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-5 opacity-60" />
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} TRUXZ. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-xs text-gray-600">
            <Link href="/login"     className="hover:text-gray-400">Login</Link>
            <Link href="/cadastrar" className="hover:text-gray-400">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
