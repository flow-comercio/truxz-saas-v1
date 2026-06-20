import { getTenantBySlug } from '@/lib/tenant'
import { db } from '@/db'
import { servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Clock, Star, ChevronRight } from 'lucide-react'
import { formatCurrency, minutesToHours } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.slug)
  if (!tenant) return { title: 'Não encontrado' }
  return {
    title: tenant.nome,
    description: `Agende seus serviços automotivos na ${tenant.nome}`,
    themeColor: tenant.corPrimaria,
  }
}

export default async function TenantLandingPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenantBySlug(params.slug)
  if (!tenant) notFound()

  if (tenant.status === 'inativa' || tenant.status === 'suspensa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-gray-900">{tenant.nome}</h1>
          <p className="text-gray-500 mt-2">Esta loja está temporariamente indisponível.</p>
        </div>
      </div>
    )
  }

  const listaServicos = await db
    .select()
    .from(servicos)
    .where(and(eq(servicos.lojaId, tenant.id), eq(servicos.ativo, true)))
    .orderBy(servicos.ordem, servicos.nome)

  const cor = tenant.corPrimaria ?? '#ea580c'
  const cfg = tenant.configuracoes as any

  // Agrupa por categoria
  const categorias = listaServicos.reduce<Record<string, typeof listaServicos>>((acc, s) => {
    const cat = s.categoria ?? 'Serviços'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const whatsapp = cfg?.whatsapp ?? tenant.telefone
  const endereco = [tenant.logradouro, tenant.numero, tenant.bairro, tenant.cidade, tenant.estado]
    .filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${cor}, ${cor}dd)` }} className="px-5 pt-12 pb-10">
        <div className="max-w-lg mx-auto text-center">
          {tenant.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.nome}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 shadow-lg border-4 border-white/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 text-4xl">
              🚗
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{tenant.nome}</h1>
          {cfg?.mensagemBoasVindas && (
            <p className="text-white/80 text-sm mt-2">{cfg.mensagemBoasVindas}</p>
          )}
          {endereco && (
            <div className="flex items-center justify-center gap-1 mt-3 text-white/70 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              {endereco}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-8">
        {/* CTA Agendar */}
        <Link
          href="/cliente/agendar"
          style={{ borderColor: cor }}
          className="block bg-white rounded-2xl shadow-lg p-5 border-2 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-lg">Agendar Serviço</p>
              <p className="text-sm text-gray-500 mt-0.5">Escolha o serviço e horário</p>
            </div>
            <div
              style={{ backgroundColor: cor }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>

        {/* Catálogo de serviços */}
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Nossos Serviços</h2>
          {listaServicos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Em breve...</p>
          ) : (
            Object.entries(categorias).map(([cat, svcs]) => (
              <div key={cat} className="mb-5 last:mb-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
                <div className="space-y-2">
                  {svcs.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 mr-3">
                        <p className="font-medium text-gray-900 text-sm">{s.nome}</p>
                        {s.descricao && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.descricao}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {minutesToHours(s.duracaoMinutos)}
                        </div>
                      </div>
                      <p style={{ color: cor }} className="font-bold text-sm flex-shrink-0">
                        {formatCurrency(parseFloat(s.preco))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Horários */}
        {cfg?.horarioAbertura && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: cor }} />
              Horário de Funcionamento
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Segunda a Sábado</span>
              <span className="font-medium text-gray-900">
                {cfg.horarioAbertura} — {cfg.horarioFechamento}
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 p-4 rounded-2xl text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar no WhatsApp
          </a>
        )}

        {/* Login/Área do cliente */}
        <div className="text-center pt-2">
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Já tenho conta — entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
