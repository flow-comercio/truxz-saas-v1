import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import {
  operadores, xpOperador, eventosXp, metas, comissoes,
  ordensServico, agendamentos, conquistasOperador, conquistas
} from '@/db/schema'
import { eq, and, gte, desc, count, sql } from 'drizzle-orm'

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!
  const userId = session.user.id

  // Busca operador pelo userId
  const [op] = await db.select().from(operadores)
    .where(and(eq(operadores.usuarioId, userId), eq(operadores.lojaId, lojaId)))
    .limit(1)

  if (!op) return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 })

  const opId = op.id
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const mesStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`

  // XP e nível
  let [xp] = await db.select().from(xpOperador)
    .where(and(eq(xpOperador.operadorId, opId), eq(xpOperador.lojaId, lojaId)))
    .limit(1)

  if (!xp) {
    const [novo] = await db.insert(xpOperador).values({ lojaId, operadorId: opId }).returning()
    xp = novo
  }

  // Últimos eventos XP
  const ultimosEventos = await db.select().from(eventosXp)
    .where(and(eq(eventosXp.operadorId, opId), eq(eventosXp.lojaId, lojaId)))
    .orderBy(desc(eventosXp.criadoEm)).limit(10)

  // OS concluídas no mês
  const [{ osMes }] = await db.select({ osMes: count() }).from(ordensServico)
    .where(and(
      eq(ordensServico.operadorId, opId),
      eq(ordensServico.lojaId, lojaId),
      eq(ordensServico.status, 'concluida'),
      gte(ordensServico.concluidoEm, inicioMes)
    ))

  // Agendamentos atendidos no mês
  const [{ agMes }] = await db.select({ agMes: count() }).from(agendamentos)
    .where(and(
      eq(agendamentos.operadorId, opId),
      eq(agendamentos.lojaId, lojaId),
      gte(agendamentos.dataHoraInicio, inicioMes)
    ))

  // Receita gerada no mês (via OS)
  const [{ receitaMes }] = await db.select({
    receitaMes: sql<string>`COALESCE(SUM(${ordensServico.total}), 0)`
  }).from(ordensServico)
    .where(and(
      eq(ordensServico.operadorId, opId),
      eq(ordensServico.lojaId, lojaId),
      eq(ordensServico.status, 'concluida'),
      gte(ordensServico.concluidoEm, inicioMes)
    ))

  // Metas do mês
  const metasMes = await db.select().from(metas)
    .where(and(
      eq(metas.lojaId, lojaId),
      and(
        eq(metas.operadorId, opId),
        eq(metas.periodo, 'mensal'),
        eq(metas.mes, mesStr),
        eq(metas.ativo, true)
      )
    ))

  // Comissões do mês
  const [{ comissaoMes }] = await db.select({
    comissaoMes: sql<string>`COALESCE(SUM(${comissoes.valor}), 0)`
  }).from(comissoes)
    .where(and(
      eq(comissoes.operadorId, opId),
      eq(comissoes.lojaId, lojaId),
      gte(comissoes.criadoEm, inicioMes)
    ))

  const [{ comissaoPendente }] = await db.select({
    comissaoPendente: sql<string>`COALESCE(SUM(${comissoes.valor}), 0)`
  }).from(comissoes)
    .where(and(
      eq(comissoes.operadorId, opId),
      eq(comissoes.lojaId, lojaId),
      eq(comissoes.status, 'pendente')
    ))

  // Conquistas
  const badges = await db.select({
    codigo: conquistas.codigo,
    nome: conquistas.nome,
    icone: conquistas.icone,
    cor: conquistas.cor,
    desbloqueadoEm: conquistasOperador.desbloqueadoEm,
  })
    .from(conquistasOperador)
    .innerJoin(conquistas, eq(conquistasOperador.conquistaId, conquistas.id))
    .where(eq(conquistasOperador.operadorId, opId))
    .orderBy(desc(conquistasOperador.desbloqueadoEm))
    .limit(6)

  // Ranking da loja (top 5)
  const ranking = await db.select({
    operadorId: xpOperador.operadorId,
    pontosAtuais: xpOperador.pontosAtuais,
    nivel: xpOperador.nivel,
  })
    .from(xpOperador)
    .where(eq(xpOperador.lojaId, lojaId))
    .orderBy(desc(xpOperador.pontosAtuais))
    .limit(5)

  // Calcular progresso de metas
  const metasComProgresso = metasMes.map(m => {
    let valorAtual = 0
    if (m.tipo === 'os_concluidas') valorAtual = osMes
    if (m.tipo === 'agendamentos') valorAtual = agMes
    if (m.tipo === 'receita') valorAtual = parseFloat(receitaMes ?? '0')
    const pct = Math.min(100, Math.round((valorAtual / parseFloat(m.valorMeta as string)) * 100))
    return { ...m, valorAtual, percentual: pct }
  })

  // Calcular nível baseado em XP total
  const pontosTotal = xp.totalHistorico ?? 0
  const nivel = Math.floor(pontosTotal / 500) + 1
  const pontosProxNivel = nivel * 500
  const pontosNivelAtual = (nivel - 1) * 500
  const progressoNivel = Math.round(((pontosTotal - pontosNivelAtual) / (pontosProxNivel - pontosNivelAtual)) * 100)

  return NextResponse.json({
    xp: { ...xp, nivel, progressoNivel, pontosProxNivel },
    metricas: { osMes, agMes, receitaMes: parseFloat(receitaMes ?? '0') },
    metas: metasComProgresso,
    comissoes: {
      mes: parseFloat(comissaoMes ?? '0'),
      pendente: parseFloat(comissaoPendente ?? '0'),
    },
    badges,
    ranking: ranking.map((r, i) => ({ ...r, posicao: i + 1, isEu: r.operadorId === opId })),
    ultimosEventos,
  })
}
