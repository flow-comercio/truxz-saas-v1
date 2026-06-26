import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })

  await db.insert(pushSubscriptions)
    .values({
      usuarioId: session.user.id,
      lojaId: session.user.lojaId ?? null,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { usuarioId: session.user.id, lojaId: session.user.lojaId ?? null },
    })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { endpoint } = await req.json()
  if (endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  }
  return NextResponse.json({ ok: true })
}
