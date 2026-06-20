export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, usuarios } from '@/db/schema'
import { eq, and, gte, lte, SQL } from 'drizzle-orm'
import { z } from 'zod'
import { verificarLimiteAgendamento } from '@/lib/plano-check'
import { verificarDisponibilidade } from '@/lib/conflito-horario'

const schema = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid(),
  veiculoId: z.string().uuid().optional(),
  operadorId: z.string().uuid().optional(),
  dataHoraInicio: z.string().datetime(),
  observacoes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dataParam   = searchParams.get('data')
  const statusParam = searchParams.get('status')

  const conditions: SQL[] = [eq(agendamentos.lojaId, session.user.lojaId)]

  if (dataParam) {
    const inicio = new Date(dataParam + 'T00:00:00')
    const fim    = new Date(dataParam + 'T23:59:59')
    conditions.push(gte(agendamentos.dataHoraInicio, inicio))
    conditions.push(lte(agendamentos.dataHoraInicio, fim))
  }
  if (statusParam) {
    conditions.push(eq(agendamentos.status, statusParam as any))
  }

  const lista = await db
    .select({
      id: agendamentos.id,
      status: agendamentos.status,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      precoTotal: agendamentos.precoTotal,
      observacoes: agendamentos.observacoes,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      servicoNome: servicos.nome,
      servicoDuracao: servicos.duracaoMinutos,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(...conditions))
    .orderBy(agendamentos.dataHoraInicio)

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  // ── 1. Verificar limite do plano ──────────────────────────────────────────
  const limite = await verificarLimiteAgendamento(session.user.lojaId)
  if (!limite.permitido) {
    return NextResponse.json({ error: limite.motivo }, { status: 403 })
  }

  // ── 2. Buscar serviço ──────────────────────────────────────────────────────
  const [servico] = await db
    .select({ preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos })
    .from(servicos)
    .where(and(eq(servicos.id, parsed.data.servicoId), eq(servicos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

  const dataInicio = new Date(parsed.data.dataHoraInicio)
  const dataFim    = new Date(dataInicio.getTime() + servico.duracaoMinutos * 60_000)

  // ── 3. Verificar conflito de horário ───────────────────────────────────────
  const disponivel = await verificarDisponibilidade({
    lojaId: session.user.lojaId,
    dataHoraInicio: dataInicio,
    dataHoraFim: dataFim,
    operadorId: parsed.data.operadorId,
  })
  if (!disponivel.disponivel) {
    return NextResponse.json({ error: disponivel.motivo }, { status: 409 })
  }

  // ── 4. Criar agendamento ───────────────────────────────────────────────────
  const [novo] = await db.insert(agendamentos).values({
    lojaId: session.user.lojaId,
    clienteId: parsed.data.clienteId,
    servicoId: parsed.data.servicoId,
    veiculoId: parsed.data.veiculoId,
    operadorId: parsed.data.operadorId,
    dataHoraInicio: dataInicio,
    dataHoraFim: dataFim,
    precoTotal: servico.preco,
    observacoes: parsed.data.observacoes,
    status: 'pendente',
  }).returning()

  return NextResponse.json(novo, { status: 201 })
}
