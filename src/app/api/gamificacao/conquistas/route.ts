import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import {
  operadores, xpOperador, conquistas, conquistasOperador, usuarios,
} from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const [op] = await db.select().from(operadores)
    .where(and(eq(operadores.usuarioId, session.user.id), eq(operadores.lojaId, lojaId)))
    .limit(1)

  if (!op) return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 })

  const [todasConquistas, minhasConquistas, ranking] = await Promise.all([
    db.select().from(conquistas).orderBy(conquistas.nome),
    db.select({
      conquistaId: conquistasOperador.conquistaId,
      desbloqueadoEm: conquistasOperador.desbloqueadoEm,
    })
      .from(conquistasOperador)
      .where(eq(conquistasOperador.operadorId, op.id))
      .orderBy(desc(conquistasOperador.desbloqueadoEm)),
    db.select({
      operadorId: xpOperador.operadorId,
      pontosAtuais: xpOperador.pontosAtuais,
      totalHistorico: xpOperador.totalHistorico,
      nivel: xpOperador.nivel,
      nome: usuarios.nome,
    })
      .from(xpOperador)
      .innerJoin(operadores, eq(xpOperador.operadorId, operadores.id))
      .innerJoin(usuarios, eq(operadores.usuarioId, usuarios.id))
      .where(eq(xpOperador.lojaId, lojaId))
      .orderBy(desc(xpOperador.pontosAtuais))
      .limit(20),
  ])

  const desbloqueadasMap = new Map(
    minhasConquistas.map(c => [c.conquistaId, c.desbloqueadoEm])
  )

  const conquistasComStatus = todasConquistas.map(c => ({
    ...c,
    desbloqueada: desbloqueadasMap.has(c.id),
    desbloqueadoEm: desbloqueadasMap.get(c.id) ?? null,
  }))

  return NextResponse.json({
    conquistas: conquistasComStatus,
    ranking: ranking.map((r, i) => ({
      ...r,
      posicao: i + 1,
      isEu: r.operadorId === op.id,
    })),
    total: todasConquistas.length,
    desbloqueadas: minhasConquistas.length,
  })
}
