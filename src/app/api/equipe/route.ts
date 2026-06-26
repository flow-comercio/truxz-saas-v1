export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { usuarios, operadores } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  role: z.enum(['admin_loja', 'operador']),
  senha: z.string().min(6),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lista = await db.select({
    id: usuarios.id,
    nome: usuarios.nome,
    email: usuarios.email,
    telefone: usuarios.telefone,
    role: usuarios.role,
    ativo: usuarios.ativo,
    criadoEm: usuarios.criadoEm,
    operadorId: operadores.id,
  })
  .from(usuarios)
  .leftJoin(operadores, and(
    eq(operadores.usuarioId, usuarios.id),
    eq(operadores.lojaId, session.user.lojaId),
  ))
  .where(and(
    eq(usuarios.lojaId, session.user.lojaId),
    ne(usuarios.role, 'cliente')
  ))
  .orderBy(usuarios.nome)

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin_loja' && session.user.role !== 'master') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10)
  try {
    const [novo] = await db.insert(usuarios).values({
      lojaId: session.user.lojaId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      senhaHash,
      role: parsed.data.role,
    }).returning({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email, role: usuarios.role })
    return NextResponse.json(novo, { status: 201 })
  } catch (e: any) {
    if (e.code === '23505') return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    throw e
  }
}
