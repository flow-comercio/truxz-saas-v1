import { getTenantBySlug } from '@/lib/tenant'
import { db } from '@/db'
import { servicos, agendamentos, usuarios } from '@/db/schema'
import { eq, and, gte, lt, desc, count, sql, isNotNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, CheckCircle2, Star, ChevronRight, Phone, Calendar, Zap, Shield, Award } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import type { Metadata } from 'next'
import ChatPublico from './chat-publico'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.slug)
  if (!tenant) return { title: 'Não encontrado' }
  const cfg = tenant.configuracoes as any
  return {
    title: `${tenant.nome} — Estética Automotiva`,
    description: cfg?.mensagemBoasVindas ?? `Agende seu serviço automotivo na ${tenant.nome}. Qualidade e praticidade.`,
    themeColor: '#9D4EDD',
    openGraph: {
      title: tenant.nome,
      description: cfg?.mensagemBoasVindas ?? `Agende seu serviço automotivo na ${tenant.nome}`,
      images: tenant.logoUrl ? [tenant.logoUrl] : [],
    },
  }
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/)
  return m?.[1] ?? null
}

function StarRating({ valor }: { valor: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className="w-3.5 h-3.5"
          fill={i <= Math.round(valor) ? '#FBBF24' : 'none'}
          stroke={i <= Math.round(valor) ? '#FBBF24' : '#55556A'}
        />
      ))}
    </div>
  )
}

export default async function TenantLandingPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenantBySlug(params.slug)
  if (!tenant) notFound()

  if (tenant.status === 'inativa' || tenant.status === 'suspensa') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0B1E' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.2)' }}>
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-black text-white">{tenant.nome}</h1>
          <p className="mt-2" style={{ color: '#A0A0B8' }}>Esta loja está temporariamente indisponível.</p>
        </div>
      </div>
    )
  }

  const cfg = tenant.configuracoes as any

  // Dados para prova social
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)

  const [
    listaServicos,
    [{ total: totalConcluidos }],
    avaliacaoResult,
    depoimentos,
    [{ agendadosHoje }],
  ] = await Promise.all([
    db.select().from(servicos)
      .where(and(eq(servicos.lojaId, tenant.id), eq(servicos.ativo, true)))
      .orderBy(servicos.ordem, servicos.nome),

    db.select({ total: count() }).from(agendamentos)
      .where(and(eq(agendamentos.lojaId, tenant.id), eq(agendamentos.status, 'concluido'))),

    db.select({ media: sql<number>`ROUND(AVG(${agendamentos.avaliacao})::numeric, 1)` })
      .from(agendamentos)
      .where(and(eq(agendamentos.lojaId, tenant.id), isNotNull(agendamentos.avaliacao))),

    db.select({
      avaliacao: agendamentos.avaliacao,
      comentario: agendamentos.comentarioAvaliacao,
      clienteNome: usuarios.nome,
      criadoEm: agendamentos.criadoEm,
    })
      .from(agendamentos)
      .leftJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
      .where(and(
        eq(agendamentos.lojaId, tenant.id),
        isNotNull(agendamentos.comentarioAvaliacao),
        gte(agendamentos.avaliacao, 4),
      ))
      .orderBy(desc(agendamentos.criadoEm))
      .limit(4),

    db.select({ agendadosHoje: count() }).from(agendamentos)
      .where(and(
        eq(agendamentos.lojaId, tenant.id),
        gte(agendamentos.dataHoraInicio, hoje),
        lt(agendamentos.dataHoraInicio, amanha),
      )),
  ])

  const mediaAvaliacao = avaliacaoResult[0]?.media ?? 0
  const whatsapp = cfg?.whatsapp ?? tenant.telefone
  const endereco = [tenant.logradouro, tenant.numero, tenant.bairro, tenant.cidade, tenant.estado].filter(Boolean).join(', ')
  const videoId = cfg?.videoUrl ? getYouTubeId(cfg.videoUrl) : null

  // Agrupar serviços por categoria e marcar "Mais Popular"
  const categorias = listaServicos.reduce<Record<string, typeof listaServicos>>((acc, s) => {
    const cat = s.categoria ?? 'Serviços'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  // Marcar o mais popular: serviço com preço mediano em cada categoria
  function getMaisPopular(svcs: typeof listaServicos): string | null {
    if (svcs.length < 2) return null
    const sorted = [...svcs].sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco))
    const mid = Math.floor(sorted.length / 2)
    return sorted[mid].id
  }

  const whatsappUrl = whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, '')}` : null

  return (
    <div className="min-h-screen" style={{ background: '#0D0B1E', fontFamily: 'Nunito, sans-serif', color: '#fff' }}>

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(13,11,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(157,78,221,0.12)' }}>
        <div className="flex items-center gap-2.5">
          {tenant.logoUrl
            ? <img src={tenant.logoUrl} alt={tenant.nome} className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'linear-gradient(135deg,rgba(157,78,221,0.4),rgba(123,47,190,0.3))' }}>🚗</div>
          }
          <span className="font-black text-white text-sm truncate max-w-[140px]">{tenant.nome}</span>
        </div>
        <Link href="/cliente/agendar"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-white text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', boxShadow: '0 0 16px rgba(157,78,221,0.4)' }}>
          <Calendar className="w-3.5 h-3.5" /> Agendar
        </Link>
      </header>

      {/* ── HERO ── */}
      <section className="relative px-5 pt-10 pb-16 text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(157,78,221,0.18) 0%, rgba(90,24,154,0.08) 60%, transparent 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(rgba(157,78,221,1) 1px,transparent 1px),linear-gradient(90deg,rgba(157,78,221,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Orbs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(157,78,221,0.25),transparent 70%)' }} />

        <div className="max-w-lg mx-auto relative">
          {/* Logo */}
          {tenant.logoUrl
            ? <img src={tenant.logoUrl} alt={tenant.nome}
                className="w-28 h-28 rounded-3xl object-cover mx-auto mb-5 shadow-2xl"
                style={{ border: '2px solid rgba(157,78,221,0.5)', boxShadow: '0 0 40px rgba(157,78,221,0.3)' }} />
            : <div className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl"
                style={{ background: 'linear-gradient(135deg,rgba(157,78,221,0.3),rgba(123,47,190,0.2))', border: '2px solid rgba(157,78,221,0.4)', boxShadow: '0 0 40px rgba(157,78,221,0.3)' }}>🚗</div>
          }

          {/* Urgência */}
          {agendadosHoje > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
              <Zap className="w-3 h-3" fill="#FBBF24" /> {agendadosHoje} agendamentos confirmados hoje
            </div>
          )}

          <h1 className="text-3xl font-black text-white leading-tight">
            {cfg?.tagline ?? 'Seu carro merece o melhor cuidado'}
          </h1>
          <p className="text-base mt-3" style={{ color: '#A0A0B8' }}>
            {cfg?.mensagemBoasVindas ?? `Serviços de estética automotiva com qualidade e agilidade em ${tenant.cidade ?? 'sua cidade'}.`}
          </p>

          {/* Rating inline */}
          {mediaAvaliacao > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4" fill={i <= Math.round(mediaAvaliacao) ? '#FBBF24' : 'none'} stroke={i <= Math.round(mediaAvaliacao) ? '#FBBF24' : '#55556A'} />
                ))}
              </div>
              <span className="font-black text-white">{mediaAvaliacao}</span>
              <span className="text-sm" style={{ color: '#A0A0B8' }}>({totalConcluidos} serviços)</span>
            </div>
          )}

          {/* CTAs principais */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <Link href="/cliente/agendar"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', boxShadow: '0 0 30px rgba(157,78,221,0.45)' }}>
              <Calendar className="w-5 h-5" /> Agendar Agora
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 0 20px rgba(37,211,102,0.3)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>

          {/* Micro-trust */}
          <p className="text-xs mt-3" style={{ color: '#55556A' }}>
            ✓ Agendamento online gratuito &nbsp;·&nbsp; ✓ Sem taxas extras
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="px-4 py-5"
        style={{ background: 'rgba(157,78,221,0.06)', borderTop: '1px solid rgba(157,78,221,0.12)', borderBottom: '1px solid rgba(157,78,221,0.12)' }}>
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-white">{totalConcluidos > 0 ? `${totalConcluidos}+` : '100+'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>Carros atendidos</p>
          </div>
          <div style={{ borderLeft: '1px solid rgba(157,78,221,0.2)', borderRight: '1px solid rgba(157,78,221,0.2)' }}>
            <p className="text-2xl font-black" style={{ color: '#FBBF24' }}>
              {mediaAvaliacao > 0 ? mediaAvaliacao : '5.0'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>Nota média</p>
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: '#9D4EDD' }}>
              {cfg?.anosExperiencia ? `${cfg.anosExperiencia}+` : '✓'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>
              {cfg?.anosExperiencia ? 'Anos de exp.' : 'Qualidade'}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 space-y-8 py-8">

        {/* ── VÍDEO ── */}
        {videoId && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#9D4EDD,#7B2FBE)' }} />
              <h2 className="text-lg font-black text-white">Veja como trabalhamos</h2>
            </div>
            <div className="relative rounded-2xl overflow-hidden"
              style={{ paddingBottom: '56.25%', height: 0, border: '1px solid rgba(157,78,221,0.2)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Vídeo da loja"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
              />
            </div>
          </section>
        )}

        {/* ── COMO FUNCIONA ── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#9D4EDD,#7B2FBE)' }} />
            <h2 className="text-lg font-black text-white">Como funciona</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '📱', step: '01', titulo: 'Escolha', desc: 'Selecione o serviço e horário ideal' },
              { icon: '✅', step: '02', titulo: 'Confirme', desc: 'Receba confirmação instantânea' },
              { icon: '🚗', step: '03', titulo: 'Aproveite', desc: 'Seu carro fica como novo' },
            ].map(item => (
              <div key={item.step} className="relative p-3 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(157,78,221,0.12)' }}>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', color: '#fff' }}>{item.step}</div>
                <div className="text-2xl mt-2">{item.icon}</div>
                <p className="font-black text-white text-xs mt-1">{item.titulo}</p>
                <p className="text-xs mt-0.5 leading-tight" style={{ color: '#55556A' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVIÇOS ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#9D4EDD,#7B2FBE)' }} />
              <h2 className="text-lg font-black text-white">Nossos Serviços</h2>
            </div>
            <Link href="/cliente/agendar" className="text-xs font-bold" style={{ color: '#9D4EDD' }}>
              Ver todos →
            </Link>
          </div>

          {listaServicos.length === 0 ? (
            <div className="text-center py-8 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(157,78,221,0.1)' }}>
              <p style={{ color: '#55556A' }}>Em breve...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(categorias).map(([cat, svcs]) => {
                const popularId = getMaisPopular(svcs)
                const sorted = [...svcs].sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco))
                return (
                  <div key={cat}>
                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9D4EDD' }}>{cat}</p>
                    <div className="space-y-2.5">
                      {sorted.map((s, idx) => {
                        const isPopular = s.id === popularId
                        const isDestaque = idx === 0 && sorted.length > 1
                        return (
                          <div key={s.id} className="relative rounded-2xl overflow-hidden transition-all"
                            style={{
                              background: isPopular ? 'rgba(157,78,221,0.08)' : 'rgba(255,255,255,0.025)',
                              border: isPopular ? '1.5px solid rgba(157,78,221,0.4)' : '1px solid rgba(157,78,221,0.1)',
                            }}>
                            {/* Shimmer top */}
                            <div className="absolute top-0 left-0 right-0 h-px"
                              style={{ background: `linear-gradient(90deg,transparent,${isPopular ? 'rgba(157,78,221,0.6)' : 'rgba(157,78,221,0.2)'},transparent)` }} />

                            {/* Badge */}
                            {isPopular && (
                              <div className="absolute top-3 right-3">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                  style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', color: '#fff' }}>
                                  ⭐ Mais Popular
                                </span>
                              </div>
                            )}
                            {isDestaque && !isPopular && (
                              <div className="absolute top-3 right-3">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                                  Premium
                                </span>
                              </div>
                            )}

                            <div className="p-4">
                              <div className="pr-20">
                                <p className="font-black text-white">{s.nome}</p>
                                {s.descricao && (
                                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#A0A0B8' }}>{s.descricao}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center gap-1 text-xs" style={{ color: '#55556A' }}>
                                    <Clock className="w-3 h-3" />{minutesToHours(s.duracaoMinutos)}
                                  </div>
                                  {isPopular && (
                                    <div className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
                                      <CheckCircle2 className="w-3 h-3" /> Mais vendido
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <p className="font-black text-xl" style={{ color: isPopular ? '#C77DFF' : '#9D4EDD' }}>
                                  {formatCurrency(parseFloat(s.preco))}
                                </p>
                                <Link href={`/cliente/agendar?servicoId=${s.id}`}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95"
                                  style={{
                                    background: isPopular ? 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' : 'rgba(157,78,221,0.15)',
                                    color: '#fff',
                                    border: isPopular ? 'none' : '1px solid rgba(157,78,221,0.3)',
                                    boxShadow: isPopular ? '0 0 16px rgba(157,78,221,0.35)' : 'none',
                                  }}>
                                  Agendar <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── DEPOIMENTOS ── */}
        {depoimentos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#9D4EDD,#7B2FBE)' }} />
              <h2 className="text-lg font-black text-white">O que nossos clientes dizem</h2>
            </div>
            <div className="space-y-3">
              {depoimentos.map((d, i) => (
                <div key={i} className="relative p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(157,78,221,0.12)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.25),transparent)' }} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: 'linear-gradient(135deg,rgba(157,78,221,0.4),rgba(123,47,190,0.3))', color: '#C77DFF' }}>
                          {(d.clienteNome ?? 'C')[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-white text-sm">{d.clienteNome?.split(' ')[0] ?? 'Cliente'}</span>
                      </div>
                      {d.avaliacao && <StarRating valor={d.avaliacao} />}
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: '#A0A0B8' }}>
                        "{d.comentario}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── DIFERENCIAIS ── */}
        <section className="relative p-5 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(157,78,221,0.06)', border: '1px solid rgba(157,78,221,0.15)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.5),transparent)' }} />
          <h2 className="text-base font-black text-white mb-4">Por que escolher a {tenant.nome}?</h2>
          <div className="space-y-3">
            {[
              { icon: <Shield className="w-4 h-4" />, titulo: 'Qualidade garantida', desc: 'Profissionais treinados e produtos premium' },
              { icon: <Zap className="w-4 h-4" />, titulo: 'Agendamento rápido', desc: 'Reserve seu horário em menos de 1 minuto' },
              { icon: <Award className="w-4 h-4" />, titulo: 'Atendimento personalizado', desc: 'Cada carro recebe atenção individualizada' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(157,78,221,0.15)', color: '#9D4EDD' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.titulo}</p>
                  <p className="text-xs" style={{ color: '#55556A' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HORÁRIOS + ENDEREÇO ── */}
        {(cfg?.horarioAbertura || endereco) && (
          <section className="grid grid-cols-1 gap-3">
            {cfg?.horarioAbertura && (
              <div className="relative p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(157,78,221,0.12)' }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.25),transparent)' }} />
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" style={{ color: '#9D4EDD' }} />
                  <span className="font-black text-white text-sm">Horário de Funcionamento</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#A0A0B8' }}>{cfg.diasFuncionamento ?? 'Seg. a Sáb.'}</span>
                    <span className="font-bold text-white">{cfg.horarioAbertura} — {cfg.horarioFechamento}</span>
                  </div>
                </div>
              </div>
            )}
            {endereco && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(endereco)}`}
                target="_blank" rel="noopener noreferrer"
                className="relative p-4 rounded-2xl flex items-center gap-3 transition-all"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(157,78,221,0.12)' }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.25),transparent)' }} />
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#9D4EDD' }} />
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Como chegar</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A0A0B8' }}>{endereco}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#55556A' }} />
              </a>
            )}
          </section>
        )}

        {/* ── CTA FINAL ── */}
        <section className="relative rounded-3xl overflow-hidden px-5 py-8 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(157,78,221,0.2),rgba(123,47,190,0.15))', border: '1.5px solid rgba(157,78,221,0.3)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(157,78,221,0.8),transparent)' }} />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(157,78,221,0.2),transparent 70%)' }} />
          <h2 className="text-xl font-black text-white relative">
            Seu carro merece o melhor.<br />Agende agora.
          </h2>
          <p className="text-sm mt-2 relative" style={{ color: '#A0A0B8' }}>
            Rápido, fácil e sem complicação.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Link href="/cliente/agendar"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', boxShadow: '0 0 30px rgba(157,78,221,0.5)' }}>
              <Calendar className="w-5 h-5" /> Agendar Online Agora
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95"
                style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar no WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* Login link */}
        <div className="text-center pb-2">
          <Link href="/login" className="text-sm transition-colors" style={{ color: '#55556A' }}>
            Já tenho conta — entrar
          </Link>
        </div>

      </div>

      {/* ── CHAT IA FLUTUANTE ── */}
      <ChatPublico slug={params.slug} nomeLoja={tenant.nome} />

    </div>
  )
}
