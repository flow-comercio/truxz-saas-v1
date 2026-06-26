import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { ordensServico, usuarios, veiculos, servicos, operadores, orcamentos } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where = status
    ? and(eq(ordensServico.lojaId, lojaId), eq(ordensServico.status, status as any))
    : eq(ordensServico.lojaId, lojaId)

  const rows = await db
    .select({
      id: ordensServico.id,
      numero: ordensServico.numero,
      status: ordensServico.status,
      total: ordensServico.total,
      placaLida: ordensServico.placaLida,
      quilometragem: ordensServico.quilometragem,
      previsaoEntrega: ordensServico.previsaoEntrega,
      criadoEm: ordensServico.criadoEm,
      clienteNome: usuarios.nome,
      clienteTelefone: usuarios.telefone,
      veiculoPlaca: veiculos.placa,
      veiculoModelo: veiculos.modelo,
      veiculoMarca: veiculos.marca,
      veiculoCor: veiculos.cor,
    })
    .from(ordensServico)
    .leftJoin(usuarios, eq(ordensServico.clienteId, usuarios.id))
    .leftJoin(veiculos, eq(ordensServico.veiculoId, veiculos.id))
    .where(where)
    .orderBy(desc(ordensServico.criadoEm))
    .limit(100)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const body = await req.json()

  // Próximo número de OS para essa loja
  const [{ maxNumero }] = await db
    .select({ maxNumero: sql<number>`COALESCE(MAX(${ordensServico.numero}), 0)` })
    .from(ordensServico)
    .where(eq(ordensServico.lojaId, lojaId))

  const numero = (maxNumero ?? 0) + 1

  const [nova] = await db.insert(ordensServico).values({
    lojaId,
    numero,
    clienteId: body.clienteId,
    veiculoId: body.veiculoId ?? null,
    orcamentoId: body.orcamentoId ?? null,
    agendamentoId: body.agendamentoId ?? null,
    operadorId: body.operadorId ?? null,
    placaLida: body.placaLida ?? null,
    placaConfirmada: body.placaConfirmada ?? false,
    quilometragem: body.quilometragem ?? null,
    diagnostico: body.diagnostico ?? null,
    observacoes: body.observacoes ?? null,
    previsaoEntrega: body.previsaoEntrega ? new Date(body.previsaoEntrega) : null,
    checklist: body.checklist ?? [],
    status: 'aberta',
  }).returning()

  return NextResponse.json(nova, { status: 201 })
}
