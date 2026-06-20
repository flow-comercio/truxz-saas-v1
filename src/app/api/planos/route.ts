export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { planos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(['basico','profissional','premium']),
  preco: z.string(),
  descricao: z.string().optional(),
  limiteAgendamentosMes: z.number().default(100),
  limiteOperadores: z.number().default(3),
  permiteRelatorios: z.boolean().default(false),
  permiteWhatsapp: z.boolean().default(false),
  permiteIA: z.boolean().default(false),
})

export async function GET() {
  const lista = await db.select().from(planos).where(eq(planos.ativo, true)).orderBy(planos.preco)
  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [novo] = await db.insert(planos).values(parsed.data).returning()
  return NextResponse.json(novo, { status: 201 })
}
