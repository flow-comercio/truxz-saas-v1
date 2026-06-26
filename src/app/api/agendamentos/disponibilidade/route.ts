export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas, servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { horariosDoDia } from '@/lib/conflito-horario'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const data       = searchParams.get('data')       // "2024-11-20"
  const servicoId  = searchParams.get('servicoId')

  if (!data || !servicoId) {
    return NextResponse.json({ error: 'data e servicoId são obrigatórios' }, { status: 400 })
  }

  // Busca configurações da loja
  const [loja] = await db
    .select({ configuracoes: lojas.configuracoes })
    .from(lojas)
    .where(eq(lojas.id, session.user.lojaId))
    .limit(1)

  const cfg = loja?.configuracoes

  // Busca duração do serviço
  const [servico] = await db
    .select({ duracaoMinutos: servicos.duracaoMinutos })
    .from(servicos)
    .where(and(eq(servicos.id, servicoId), eq(servicos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

  // Verifica se o dia está ativo
  const diaSemana = new Date(`${data}T12:00:00`).getDay()
  const diasFuncionamento = cfg?.diasFuncionamento ?? [1, 2, 3, 4, 5, 6]
  if (!diasFuncionamento.includes(diaSemana)) {
    return NextResponse.json({ slots: [], fechado: true })
  }

  const slots = await horariosDoDia({
    lojaId: session.user.lojaId,
    data,
    duracaoMinutos:  servico.duracaoMinutos,
    intervaloMinutos: cfg?.intervaloAgendamento ?? 60,
    horarioAbertura:  cfg?.horarioAbertura  ?? '08:00',
    horarioFechamento: cfg?.horarioFechamento ?? '18:00',
  })

  return NextResponse.json({ slots, fechado: false })
}
