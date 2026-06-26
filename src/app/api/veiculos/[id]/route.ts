export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { veiculos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  marca: z.string().optional(),
  modelo: z.string().optional(),
  ano: z.number().optional(),
  cor: z.string().optional(),
  tipo: z.string().optional(),
  observacoes: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [updated] = await db
    .update(veiculos)
    .set(parsed.data)
    .where(and(
      eq(veiculos.id, params.id),
      eq(veiculos.lojaId, session.user.lojaId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .delete(veiculos)
    .where(and(
      eq(veiculos.id, params.id),
      eq(veiculos.lojaId, session.user.lojaId),
    ))

  return NextResponse.json({ ok: true })
}
