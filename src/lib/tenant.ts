import { db } from '@/db'
import { lojas, planos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export interface TenantInfo {
  id: string
  slug: string
  nome: string
  logoUrl: string | null
  corPrimaria: string
  telefone: string | null
  email: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  status: string
  configuracoes: any
  planoNome: string | null
  permiteIA: boolean
  permiteWhatsapp: boolean
}

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'truxz.com.br'

/** Extrai o slug do subdomínio da requisição atual */
export function getSlugFromHost(host: string): string | null {
  // Remove porta se houver
  const hostname = host.split(':')[0]

  // Ex: minhaloja.truxz.com.br → minhaloja
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const slug = hostname.replace(`.${BASE_DOMAIN}`, '')
    if (slug && slug !== 'www') return slug
  }

  // Localhost: minhaloja.localhost → minhaloja
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace('.localhost', '')
    if (slug) return slug
  }

  return null
}

/** Busca dados completos da loja pelo slug */
export async function getTenantBySlug(slug: string): Promise<TenantInfo | null> {
  const [loja] = await db
    .select({
      id:            lojas.id,
      slug:          lojas.slug,
      nome:          lojas.nome,
      logoUrl:       lojas.logoUrl,
      corPrimaria:   lojas.corPrimaria,
      telefone:      lojas.telefone,
      email:         lojas.email,
      logradouro:    lojas.logradouro,
      numero:        lojas.numero,
      bairro:        lojas.bairro,
      cidade:        lojas.cidade,
      estado:        lojas.estado,
      status:        lojas.status,
      configuracoes: lojas.configuracoes,
      planoNome:     planos.nome,
      permiteIA:     planos.permiteIA,
      permiteWhatsapp: planos.permiteWhatsapp,
    })
    .from(lojas)
    .leftJoin(planos, eq(lojas.planoId, planos.id))
    .where(eq(lojas.slug, slug))
    .limit(1)

  if (!loja) return null

  return {
    ...loja,
    corPrimaria:     loja.corPrimaria ?? '#ea580c',
    permiteIA:       loja.permiteIA ?? false,
    permiteWhatsapp: loja.permiteWhatsapp ?? false,
  }
}

/** Busca tenant a partir do host atual (Server Component) */
export async function getCurrentTenant(): Promise<TenantInfo | null> {
  const headersList = headers()
  const host = headersList.get('host') ?? ''
  const slug = getSlugFromHost(host)
  if (!slug) return null
  return getTenantBySlug(slug)
}
