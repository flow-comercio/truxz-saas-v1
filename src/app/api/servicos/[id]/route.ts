export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  preco: z.string().optional(),
  duracaoMinutos: z.number().min(15).optional(),
  categoria: z.string().optional(),
  ativo: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [updated] = await db
    .update(servicos)
    .set(parsed.data)
    .where(and(eq(servicos.id, params.id), eq(servicos.lojaId, session.user.lojaId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .update(servicos)
    .set({ ativo: false })
    .where(and(eq(servicos.id, params.id), eq(servicos.lojaId, session.user.lojaId)))

  return NextResponse.json({ ok: true })
}
