export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { veiculos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  placa: z.string().min(7).max(8).transform(v => v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  ano: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  cor: z.string().optional(),
  tipo: z.enum(['carro', 'moto', 'caminhonete', 'van', 'caminhao']).default('carro'),
  observacoes: z.string().optional(),
  clienteId: z.string().uuid().optional(),  // admin pode informar, cliente usa sessão
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId') ?? session.user.id

  // Clientes só veem seus próprios veículos
  if (session.user.role === 'cliente' && clienteId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lista = await db
    .select()
    .from(veiculos)
    .where(and(
      eq(veiculos.clienteId, clienteId),
      eq(veiculos.lojaId, session.user.lojaId!),
    ))
    .orderBy(veiculos.placa)

  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id || !session.user.lojaId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const clienteId = (session.user.role === 'cliente')
    ? session.user.id
    : (parsed.data.clienteId ?? session.user.id)

  const [novo] = await db.insert(veiculos).values({
    clienteId,
    lojaId: session.user.lojaId,
    placa:   parsed.data.placa,
    marca:   parsed.data.marca,
    modelo:  parsed.data.modelo,
    ano:     parsed.data.ano,
    cor:     parsed.data.cor,
    tipo:    parsed.data.tipo,
    observacoes: parsed.data.observacoes,
  }).returning()

  return NextResponse.json(novo, { status: 201 })
}
