export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, pagamentos, usuarios, servicos } from '@/db/schema'
import { eq, and, gte, sql, count, avg } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lojaId = session.user.lojaId
  const hoje   = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Últimos 6 meses
  const inicio6Meses = new Date()
  inicio6Meses.setMonth(inicio6Meses.getMonth() - 5)
  inicio6Meses.setDate(1)
  inicio6Meses.setHours(0, 0, 0, 0)

  const [
    receitaMensalRaw,
    agendamentosMensalRaw,
    servicosPopularesRaw,
    statusDistribRaw,
    ticketMedioRaw,
    totalClientesRaw,
    avaliacaoRaw,
    agendamentosHojeRaw,
  ] = await Promise.all([
    // Receita mensal (últimos 6 meses)
    db.select({
      mes:     sql<string>`TO_CHAR(${pagamentos.pagoEm}, 'Mon/YY')`,
      receita: sql<number>`COALESCE(SUM(${pagamentos.valor}::numeric), 0)`,
    })
    .from(pagamentos)
    .where(and(
      eq(pagamentos.lojaId, lojaId),
      eq(pagamentos.status, 'pago'),
      gte(pagamentos.pagoEm, inicio6Meses),
    ))
    .groupBy(sql`TO_CHAR(${pagamentos.pagoEm}, 'Mon/YY'), DATE_TRUNC('month', ${pagamentos.pagoEm})`)
    .orderBy(sql`DATE_TRUNC('month', ${pagamentos.pagoEm})`),

    // Agendamentos por mês
    db.select({
      mes:          sql<string>`TO_CHAR(${agendamentos.dataHoraInicio}, 'Mon/YY')`,
      agendamentos: sql<number>`COUNT(*)`,
    })
    .from(agendamentos)
    .where(and(
      eq(agendamentos.lojaId, lojaId),
      gte(agendamentos.dataHoraInicio, inicio6Meses),
    ))
    .groupBy(sql`TO_CHAR(${agendamentos.dataHoraInicio}, 'Mon/YY'), DATE_TRUNC('month', ${agendamentos.dataHoraInicio})`)
    .orderBy(sql`DATE_TRUNC('month', ${agendamentos.dataHoraInicio})`),

    // Serviços mais populares (top 5)
    db.select({
      nome:     servicos.nome,
      total:    sql<number>`COUNT(*)`,
      receita:  sql<number>`COALESCE(SUM(${agendamentos.precoTotal}::numeric), 0)`,
    })
    .from(agendamentos)
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(
      eq(agendamentos.lojaId, lojaId),
      eq(agendamentos.status, 'concluido'),
    ))
    .groupBy(servicos.nome)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5),

    // Distribuição por status
    db.select({
      status: agendamentos.status,
      total:  sql<number>`COUNT(*)`,
    })
    .from(agendamentos)
    .where(eq(agendamentos.lojaId, lojaId))
    .groupBy(agendamentos.status),

    // Ticket médio
    db.select({
      media: sql<number>`COALESCE(AVG(${pagamentos.valor}::numeric), 0)`,
    })
    .from(pagamentos)
    .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'))),

    // Total de clientes
    db.select({ total: count() })
    .from(usuarios)
    .where(and(eq(usuarios.lojaId, lojaId), eq(usuarios.role, 'cliente'))),

    // Avaliação média
    db.select({
      media: sql<number>`COALESCE(AVG(${agendamentos.avaliacao}::numeric), 0)`,
    })
    .from(agendamentos)
    .where(and(eq(agendamentos.lojaId, lojaId), sql`${agendamentos.avaliacao} IS NOT NULL`)),

    // Agendamentos hoje
    db.select({ total: count() })
    .from(agendamentos)
    .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, hoje))),
  ])

  // Merge receita + agendamentos por mês
  const mesesMap = new Map<string, { mes: string; receita: number; agendamentos: number }>()

  for (const r of receitaMensalRaw) {
    mesesMap.set(r.mes, { mes: r.mes, receita: Number(r.receita), agendamentos: 0 })
  }
  for (const a of agendamentosMensalRaw) {
    const entry = mesesMap.get(a.mes)
    if (entry) entry.agendamentos = Number(a.agendamentos)
    else mesesMap.set(a.mes, { mes: a.mes, receita: 0, agendamentos: Number(a.agendamentos) })
  }

  return NextResponse.json({
    receitaMensal:       Array.from(mesesMap.values()),
    servicosPopulares:   servicosPopularesRaw.map(s => ({ ...s, total: Number(s.total), receita: Number(s.receita) })),
    statusDistribuicao:  statusDistribRaw.map(s => ({ status: s.status, total: Number(s.total) })),
    ticketMedio:         Number(ticketMedioRaw[0]?.media ?? 0),
    totalClientes:       totalClientesRaw[0]?.total ?? 0,
    avaliacaoMedia:      Number(avaliacaoRaw[0]?.media ?? 0),
    agendamentosHoje:    agendamentosHojeRaw[0]?.total ?? 0,
  })
}
