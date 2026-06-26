import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orcamentos, itensOrcamento, usuarios, veiculos } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const rows = await db
    .select({
      id: orcamentos.id,
      numero: orcamentos.numero,
      status: orcamentos.status,
      total: orcamentos.total,
      validoAte: orcamentos.validoAte,
      criadoEm: orcamentos.criadoEm,
      clienteNome: usuarios.nome,
      veiculoPlaca: veiculos.placa,
    })
    .from(orcamentos)
    .leftJoin(usuarios, eq(orcamentos.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(orcamentos.veiculoId, veiculos.id))
    .where(eq(orcamentos.lojaId, lojaId))
    .orderBy(desc(orcamentos.criadoEm))
    .limit(50)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const body = await req.json()

  const [{ maxNumero }] = await db
    .select({ maxNumero: sql<number>`COALESCE(MAX(${orcamentos.numero}), 0)` })
    .from(orcamentos).where(eq(orcamentos.lojaId, lojaId))

  const numero = (maxNumero ?? 0) + 1

  // Calcular totais dos itens
  const itens = (body.itens ?? []) as { quantidade: string; precoUnitario: string; desconto?: string }[]
  const subtotal = itens.reduce((acc, i) => acc + parseFloat(i.quantidade) * parseFloat(i.precoUnitario), 0)
  const desconto = parseFloat(body.desconto ?? '0')
  const total = Math.max(0, subtotal - desconto)

  const [orc] = await db.insert(orcamentos).values({
    lojaId, numero,
    clienteId: body.clienteId ?? null,
    veiculoId: body.veiculoId ?? null,
    operadorId: body.operadorId ?? null,
    status: 'rascunho',
    validoAte: body.validoAte ? new Date(body.validoAte) : null,
    subtotal: subtotal.toFixed(2) as any,
    desconto: desconto.toFixed(2) as any,
    total: total.toFixed(2) as any,
    observacoes: body.observacoes ?? null,
  }).returning()

  if (itens.length > 0) {
    await db.insert(itensOrcamento).values(itens.map((item, idx) => ({
      orcamentoId: orc.id,
      tipo: item.tipo ?? 'servico' as any,
      servicoId: (item as any).servicoId ?? null,
      produtoId: (item as any).produtoId ?? null,
      descricao: (item as any).descricao ?? null,
      quantidade: item.quantidade as any,
      precoUnitario: item.precoUnitario as any,
      desconto: item.desconto ?? '0' as any,
      total: (parseFloat(item.quantidade) * parseFloat(item.precoUnitario) - parseFloat(item.desconto ?? '0')).toFixed(2) as any,
      ordem: idx,
    })))
  }

  return NextResponse.json(orc, { status: 201 })
}
