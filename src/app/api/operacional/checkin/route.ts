export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, usuarios, servicos, veiculos } from '@/db/schema'
import { eq, and, gte, lte, or, like } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json(null)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date()
  fimHoje.setHours(23, 59, 59, 999)

  const [ag] = await db
    .select({
      agendamentoId: agendamentos.id,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      servicoNome: servicos.nome,
      dataHoraInicio: agendamentos.dataHoraInicio,
      status: agendamentos.status,
      precoTotal: agendamentos.precoTotal,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .leftJoin(veiculos, eq(agendamentos.veiculoId, veiculos.id))
    .where(and(
      eq(agendamentos.lojaId, session.user.lojaId),
      gte(agendamentos.dataHoraInicio, hoje),
      lte(agendamentos.dataHoraInicio, fimHoje),
      or(
        like(usuarios.nome, `%${q}%`),
        like(usuarios.telefone, `%${q}%`),
        like(veiculos.placa, `%${q}%`),
      )!
    ))
    .limit(1)

  return NextResponse.json(ag ?? null)
}
