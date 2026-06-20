export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { planos } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const lista = await db
    .select({
      id:                   planos.id,
      nome:                 planos.nome,
      tipo:                 planos.tipo,
      preco:                planos.preco,
      descricao:            planos.descricao,
      limiteAgendamentosMes: planos.limiteAgendamentosMes,
      limiteOperadores:     planos.limiteOperadores,
      permiteRelatorios:    planos.permiteRelatorios,
      permiteWhatsapp:      planos.permiteWhatsapp,
      permiteIA:            planos.permiteIA,
    })
    .from(planos)
    .where(eq(planos.ativo, true))
    .orderBy(planos.preco)

  return NextResponse.json(lista)
}
