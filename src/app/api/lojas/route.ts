export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas, usuarios, planos } from '@/db/schema'
import { eq, count, desc } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
  planoId: z.string().uuid().optional(),
  adminNome: z.string().min(2),
  adminEmail: z.string().email(),
  adminSenha: z.string().min(6),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const lista = await db
    .select({
      id: lojas.id,
      nome: lojas.nome,
      slug: lojas.slug,
      email: lojas.email,
      telefone: lojas.telefone,
      cidade: lojas.cidade,
      estado: lojas.estado,
      status: lojas.status,
      planoNome: planos.nome,
      criadoEm: lojas.criadoEm,
    })
    .from(lojas)
    .leftJoin(planos, eq(lojas.planoId, planos.id))
    .orderBy(desc(lojas.criadoEm))

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const slug = slugify(parsed.data.nome)
  const trialExpira = new Date()
  trialExpira.setDate(trialExpira.getDate() + 14) // 14 dias trial

  const [loja] = await db.insert(lojas).values({
    nome: parsed.data.nome,
    slug,
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    cidade: parsed.data.cidade,
    estado: parsed.data.estado,
    planoId: parsed.data.planoId,
    status: 'trial',
    trialExpiraEm: trialExpira,
  }).returning()

  const senhaHash = await bcrypt.hash(parsed.data.adminSenha, 10)
  await db.insert(usuarios).values({
    lojaId: loja.id,
    nome: parsed.data.adminNome,
    email: parsed.data.adminEmail,
    senhaHash,
    role: 'admin_loja',
  })

  return NextResponse.json(loja, { status: 201 })
}
