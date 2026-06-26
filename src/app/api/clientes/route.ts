export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { usuarios } from '@/db/schema'
import { eq, and, like, or, SQL } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  senha: z.string().min(6).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  const conditions: SQL[] = [
    eq(usuarios.lojaId, session.user.lojaId),
    eq(usuarios.role, 'cliente'),
    eq(usuarios.ativo, true),
  ]

  if (q) {
    conditions.push(
      or(
        like(usuarios.nome, `%${q}%`),
        like(usuarios.telefone, `%${q}%`)
      )!
    )
  }

  const lista = await db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      telefone: usuarios.telefone,
      criadoEm: usuarios.criadoEm,
    })
    .from(usuarios)
    .where(and(...conditions))
    .limit(50)

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const senhaTemp = !parsed.data.senha ? randomBytes(6).toString('hex') : null
  const senhaHash = await bcrypt.hash(parsed.data.senha ?? senhaTemp!, 10)

  try {
    const [novo] = await db.insert(usuarios).values({
      lojaId: session.user.lojaId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      senhaHash,
      role: 'cliente',
    }).returning({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email })

    return NextResponse.json(
      { ...novo, ...(senhaTemp ? { senhaTemporaria: senhaTemp } : {}) },
      { status: 201 }
    )
  } catch (e: any) {
    if (e.code === '23505') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    throw e
  }
}
