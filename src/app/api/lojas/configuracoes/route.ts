export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [loja] = await db.select({ configuracoes: lojas.configuracoes })
    .from(lojas).where(eq(lojas.id, session.user.lojaId)).limit(1)

  return NextResponse.json(loja?.configuracoes ?? null)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin_loja', 'master'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const [updated] = await db.update(lojas)
    .set({ configuracoes: body.configuracoes, atualizadoEm: new Date() })
    .where(eq(lojas.id, session.user.lojaId))
    .returning({ configuracoes: lojas.configuracoes })

  return NextResponse.json(updated)
}
