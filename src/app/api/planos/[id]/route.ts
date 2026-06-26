export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { planos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2).optional(),
  preco: z.string().optional(),
  descricao: z.string().optional(),
  limiteAgendamentosMes: z.number().optional(),
  limiteOperadores: z.number().optional(),
  permiteRelatorios: z.boolean().optional(),
  permiteWhatsapp: z.boolean().optional(),
  permiteIA: z.boolean().optional(),
  ativo: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [updated] = await db.update(planos).set(parsed.data).where(eq(planos.id, params.id)).returning()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
