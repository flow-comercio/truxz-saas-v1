import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { estoque, movimentacoesEstoque, produtos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const { produtoId, quantidade, observacoes } = await req.json()
  if (!produtoId || !quantidade || parseFloat(quantidade) <= 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Busca estoque atual
  const [atual] = await db.select().from(estoque)
    .where(and(eq(estoque.produtoId, produtoId), eq(estoque.lojaId, lojaId)))
    .limit(1)

  const qtdAnterior = atual?.quantidade ?? '0'
  const qtdNova = (parseFloat(qtdAnterior as string) + parseFloat(quantidade)).toString()

  if (atual) {
    await db.update(estoque)
      .set({ quantidade: qtdNova as any, atualizadoEm: new Date() })
      .where(and(eq(estoque.produtoId, produtoId), eq(estoque.lojaId, lojaId)))
  } else {
    await db.insert(estoque).values({ lojaId, produtoId, quantidade: qtdNova as any })
  }

  await db.insert(movimentacoesEstoque).values({
    lojaId, produtoId,
    tipo: 'entrada',
    quantidade: quantidade as any,
    quantidadeAnterior: qtdAnterior as any,
    observacoes: observacoes ?? null,
  })

  return NextResponse.json({ ok: true, quantidadeAtual: qtdNova })
}
