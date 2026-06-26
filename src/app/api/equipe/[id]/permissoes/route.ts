import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { permissoesOperador, operadores } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const [permissoes] = await db.select().from(permissoesOperador)
    .where(eq(permissoesOperador.operadorId, params.id))
    .limit(1)

  return NextResponse.json(permissoes ?? {})
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId || session.user.role !== 'admin_loja') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const lojaId = session.user.lojaId

  // Verifica se o operador pertence à loja
  const [op] = await db.select().from(operadores)
    .where(and(eq(operadores.id, params.id), eq(operadores.lojaId, lojaId)))
    .limit(1)

  if (!op) return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 })

  const body = await req.json()

  const [existente] = await db.select().from(permissoesOperador)
    .where(eq(permissoesOperador.operadorId, params.id)).limit(1)

  if (existente) {
    const [updated] = await db.update(permissoesOperador)
      .set({ ...body, atualizadoEm: new Date() })
      .where(eq(permissoesOperador.operadorId, params.id))
      .returning()
    return NextResponse.json(updated)
  } else {
    const [created] = await db.insert(permissoesOperador)
      .values({ operadorId: params.id, lojaId, ...body })
      .returning()
    return NextResponse.json(created)
  }
}
