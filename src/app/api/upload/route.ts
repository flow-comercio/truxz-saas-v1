export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_SIZE   = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB
const ALLOWED    = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const agendamentoId = formData.get('agendamentoId') as string
  const tipo          = formData.get('tipo') as 'antes' | 'depois'
  const arquivo       = formData.get('arquivo') as File | null

  if (!agendamentoId || !tipo || !arquivo) {
    return NextResponse.json({ error: 'agendamentoId, tipo e arquivo são obrigatórios' }, { status: 400 })
  }
  if (!ALLOWED.includes(arquivo.type)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
  }
  if (arquivo.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
  }

  // Verificar que o agendamento pertence a esta loja
  const [ag] = await db
    .select({ id: agendamentos.id, fotoAntes: agendamentos.fotoAntes, fotoDepois: agendamentos.fotoDepois })
    .from(agendamentos)
    .where(and(eq(agendamentos.id, agendamentoId), eq(agendamentos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!ag) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  // Salvar arquivo
  const ext    = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const nome   = `${randomUUID()}.${ext}`
  const dir    = path.join(UPLOAD_DIR, session.user.lojaId)
  const caminho = path.join(dir, nome)
  const urlPublica = `/uploads/${session.user.lojaId}/${nome}`

  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(await arquivo.arrayBuffer())
  await writeFile(caminho, buffer)

  // Atualizar agendamento com nova URL
  const fotosAtuais = (tipo === 'antes' ? ag.fotoAntes : ag.fotoDepois) ?? []
  const novasFotos  = [...fotosAtuais, urlPublica]

  await db
    .update(agendamentos)
    .set(tipo === 'antes'
      ? { fotoAntes: novasFotos }
      : { fotoDepois: novasFotos }
    )
    .where(eq(agendamentos.id, agendamentoId))

  return NextResponse.json({ url: urlPublica, ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agendamentoId, tipo, url } = await req.json()

  const [ag] = await db
    .select({ fotoAntes: agendamentos.fotoAntes, fotoDepois: agendamentos.fotoDepois })
    .from(agendamentos)
    .where(and(eq(agendamentos.id, agendamentoId), eq(agendamentos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!ag) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  const fotosAtuais = (tipo === 'antes' ? ag.fotoAntes : ag.fotoDepois) ?? []
  const novasFotos  = fotosAtuais.filter(f => f !== url)

  await db
    .update(agendamentos)
    .set(tipo === 'antes' ? { fotoAntes: novasFotos } : { fotoDepois: novasFotos })
    .where(eq(agendamentos.id, agendamentoId))

  return NextResponse.json({ ok: true })
}
