export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['pendente','confirmado','em_andamento','concluido','cancelado','no_show']).optional(),
  operadorId: z.string().uuid().optional(),
  observacoesInternas: z.string().optional(),
  avaliacao: z.number().min(1).max(5).optional(),
  comentarioAvaliacao: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [ag] = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal,
      observacoes: agendamentos.observacoes,
      observacoesInternas: agendamentos.observacoesInternas,
      avaliacao: agendamentos.avaliacao,
      clienteId: agendamentos.clienteId,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      clienteEmail: usuarios.email,
      servicoId: agendamentos.servicoId,
      servicoNome: servicos.nome,
      servicoDuracao: servicos.duracaoMinutos,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
      veiculoCor: veiculos.cor,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!ag) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ag)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [updated] = await db
    .update(agendamentos)
    .set({ ...parsed.data, atualizadoEm: new Date() })
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.lojaId, session.user.lojaId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .update(agendamentos)
    .set({ status: 'cancelado', atualizadoEm: new Date() })
    .where(and(eq(agendamentos.id, params.id), eq(agendamentos.lojaId, session.user.lojaId)))

  return NextResponse.json({ ok: true })
}
