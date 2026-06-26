export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const ALLOWED    = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE   = 2 * 1024 * 1024 // 2MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId || !['admin_loja', 'master'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const arquivo  = formData.get('logo') as File | null

  if (!arquivo) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
  if (!ALLOWED.includes(arquivo.type)) {
    return NextResponse.json({ error: 'Use JPG, PNG, WebP ou SVG.' }, { status: 400 })
  }
  if (arquivo.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Máximo 2MB.' }, { status: 400 })
  }

  const ext     = arquivo.name.split('.').pop()?.toLowerCase() ?? 'png'
  const nome    = `logo-${randomUUID()}.${ext}`
  const dir     = path.join(UPLOAD_DIR, 'logos')
  const caminho = path.join(dir, nome)
  const url     = `/uploads/logos/${nome}`

  await mkdir(dir, { recursive: true })
  await writeFile(caminho, Buffer.from(await arquivo.arrayBuffer()))

  await db.update(lojas).set({ logoUrl: url }).where(eq(lojas.id, session.user.lojaId))

  return NextResponse.json({ url })
}
