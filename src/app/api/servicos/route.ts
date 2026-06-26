export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  preco: z.string().refine(v => !isNaN(parseFloat(v))),
  duracaoMinutos: z.number().min(15),
  categoria: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lista = await db.select().from(servicos)
    .where(and(eq(servicos.lojaId, session.user.lojaId), eq(servicos.ativo, true)))
    .orderBy(servicos.ordem, servicos.nome)

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [novo] = await db.insert(servicos).values({
    lojaId: session.user.lojaId,
    ...parsed.data,
  }).returning()

  return NextResponse.json(novo, { status: 201 })
}
