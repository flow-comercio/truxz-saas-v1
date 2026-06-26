export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  servicoId: z.string().uuid(),
  dataHoraInicio: z.string().datetime(),
  veiculoId: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id || !session.user.lojaId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [servico] = await db
    .select({ preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos })
    .from(servicos)
    .where(and(eq(servicos.id, parsed.data.servicoId), eq(servicos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

  const dataInicio = new Date(parsed.data.dataHoraInicio)
  const dataFim    = new Date(dataInicio.getTime() + servico.duracaoMinutos * 60000)

  const [novo] = await db.insert(agendamentos).values({
    lojaId: session.user.lojaId,
    clienteId: session.user.id,
    servicoId: parsed.data.servicoId,
    veiculoId: parsed.data.veiculoId,
    dataHoraInicio: dataInicio,
    dataHoraFim: dataFim,
    precoTotal: servico.preco,
    observacoes: parsed.data.observacoes,
    status: 'pendente',
  }).returning()

  return NextResponse.json(novo, { status: 201 })
}
