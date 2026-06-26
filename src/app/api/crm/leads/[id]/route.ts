import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { leads, interacoesLead, usuarios } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [lead] = await db.select()
    .from(leads)
    .where(and(eq(leads.id, params.id), eq(leads.lojaId, session.user.lojaId!)))
    .limit(1)
  if (!lead) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const historico = await db.select({
    id: interacoesLead.id,
    tipo: interacoesLead.tipo,
    conteudo: interacoesLead.conteudo,
    criadoEm: interacoesLead.criadoEm,
    autorNome: usuarios.nome,
  })
    .from(interacoesLead)
    .leftJoin(usuarios, eq(interacoesLead.autorId, usuarios.id))
    .where(eq(interacoesLead.leadId, params.id))
    .orderBy(asc(interacoesLead.criadoEm))

  return NextResponse.json({ ...lead, historico })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { interacao, ...campos } = body

  const [updated] = await db.update(leads)
    .set({ ...campos, atualizadoEm: new Date() })
    .where(and(eq(leads.id, params.id), eq(leads.lojaId, session.user.lojaId!)))
    .returning()

  if (interacao) {
    await db.insert(interacoesLead).values({
      leadId: params.id,
      lojaId: session.user.lojaId!,
      autorId: session.user.id,
      tipo: interacao.tipo,
      conteudo: interacao.conteudo,
    })
  }

  return NextResponse.json(updated)
}
