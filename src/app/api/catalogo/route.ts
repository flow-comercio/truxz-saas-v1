import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { servicos, produtos, estoque } from '@/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'

// Busca unificada de serviços + produtos para orçamentos e PDV
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q) return NextResponse.json([])

  const [svcs, prods] = await Promise.all([
    db.select({ id: servicos.id, nome: servicos.nome, preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos })
      .from(servicos)
      .where(and(eq(servicos.lojaId, lojaId), eq(servicos.ativo, true), ilike(servicos.nome, `%${q}%`)))
      .limit(8),
    db.select({ id: produtos.id, nome: produtos.nome, precoVenda: produtos.precoVenda, codigoBarras: produtos.codigoBarras })
      .from(produtos)
      .leftJoin(estoque, and(eq(estoque.produtoId, produtos.id), eq(estoque.lojaId, lojaId)))
      .where(and(
        eq(produtos.lojaId, lojaId),
        eq(produtos.ativo, true),
        eq(produtos.vendaAvulsa, true),
        or(ilike(produtos.nome, `%${q}%`), ilike(produtos.codigoBarras, `%${q}%`)),
      ))
      .limit(8),
  ])

  const resultados = [
    ...svcs.map(s => ({ ...s, _tipo: 'servico' as const })),
    ...prods.map(p => ({ ...p, _tipo: 'produto' as const })),
  ]

  return NextResponse.json(resultados)
}
