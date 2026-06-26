import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { leads, usuarios, interacoesLead } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const rows = await db.select({
    id: leads.id,
    nome: leads.nome,
    telefone: leads.telefone,
    veiculo: leads.veiculo,
    origem: leads.origem,
    estagio: leads.estagio,
    valorEstimado: leads.valorEstimado,
    criadoEm: leads.criadoEm,
    atualizadoEm: leads.atualizadoEm,
    responsavelNome: usuarios.nome,
  })
    .from(leads)
    .leftJoin(usuarios, eq(leads.responsavelId, usuarios.id))
    .where(and(eq(leads.lojaId, lojaId)))
    .orderBy(desc(leads.atualizadoEm))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, telefone, email, veiculo, origem, valorEstimado, observacoes } = body
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const [lead] = await db.insert(leads).values({
    lojaId: session.user.lojaId!,
    responsavelId: session.user.id,
    nome, telefone, email, veiculo, origem, valorEstimado, observacoes,
    estagio: 'novo',
  }).returning()

  return NextResponse.json(lead, { status: 201 })
}
