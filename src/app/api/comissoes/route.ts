import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { comissoes, operadores, usuarios } from '@/db/schema'
import { eq, and, desc, gte, lte, sum } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const { searchParams } = new URL(req.url)
  const operadorId = searchParams.get('operadorId')
  const status = searchParams.get('status')
  const de = searchParams.get('de')
  const ate = searchParams.get('ate')

  const where = [eq(comissoes.lojaId, lojaId)]
  if (operadorId) where.push(eq(comissoes.operadorId, operadorId))
  if (status) where.push(eq(comissoes.status, status as any))
  if (de) where.push(gte(comissoes.criadoEm, new Date(de)))
  if (ate) {
    const ateDate = new Date(ate)
    ateDate.setHours(23, 59, 59, 999)
    where.push(lte(comissoes.criadoEm, ateDate))
  }

  const rows = await db
    .select({
      id: comissoes.id,
      operadorId: comissoes.operadorId,
      referenciaId: comissoes.referenciaId,
      referenciaTipo: comissoes.referenciaTipo,
      valor: comissoes.valor,
      status: comissoes.status,
      pagoEm: comissoes.pagoEm,
      criadoEm: comissoes.criadoEm,
      operadorNome: usuarios.nome,
    })
    .from(comissoes)
    .leftJoin(operadores, eq(comissoes.operadorId, operadores.id))
    .leftJoin(usuarios, eq(operadores.usuarioId, usuarios.id))
    .where(and(...where))
    .orderBy(desc(comissoes.criadoEm))

  const totalPendente = rows
    .filter(r => r.status === 'pendente')
    .reduce((acc, r) => acc + parseFloat(r.valor ?? '0'), 0)

  const totalPago = rows
    .filter(r => r.status === 'paga')
    .reduce((acc, r) => acc + parseFloat(r.valor ?? '0'), 0)

  return NextResponse.json({ rows, totalPendente, totalPago })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const { ids, status } = await req.json()
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
  if (!['aprovada', 'paga', 'cancelada', 'pendente'].includes(status))
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })

  const set: Record<string, any> = { status }
  if (status === 'paga') set.pagoEm = new Date()

  for (const id of ids) {
    await db.update(comissoes)
      .set(set)
      .where(and(eq(comissoes.id, id), eq(comissoes.lojaId, lojaId)))
  }

  return NextResponse.json({ ok: true, updated: ids.length })
}
