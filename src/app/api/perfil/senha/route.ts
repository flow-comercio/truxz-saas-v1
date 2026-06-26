export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { usuarios } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  atual: z.string().min(1),
  nova: z.string().min(6),
  confirmar: z.string(),
}).refine(d => d.nova === d.confirmar, { message: 'Senhas não conferem' })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Senhas inválidas ou não conferem' }, { status: 400 })

  const [user] = await db.select({ senhaHash: usuarios.senhaHash })
    .from(usuarios).where(eq(usuarios.id, session.user.id)).limit(1)

  const ok = await bcrypt.compare(parsed.data.atual, user.senhaHash)
  if (!ok) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const novaHash = await bcrypt.hash(parsed.data.nova, 10)
  await db.update(usuarios).set({ senhaHash: novaHash }).where(eq(usuarios.id, session.user.id))

  return NextResponse.json({ ok: true })
}
