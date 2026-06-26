import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deepseekChat } from '@/lib/deepseek'
import { checkRateLimit, sanitizeHistorico } from '@/lib/rate-limit'
import { db } from '@/db'
import { agendamentos, ordensServico, pagamentos, usuarios, estoque, produtos } from '@/db/schema'
import { eq, and, gte, count, sql, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: 'IA não configurada. Adicione DEEPSEEK_API_KEY no .env' }, { status: 503 })

  const lojaId = session.user.lojaId
  if (!checkRateLimit(`ai:assistente:${session.user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const { mensagem, historico: rawHistorico = [] } = await req.json()
  if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0 || mensagem.length > 800) {
    return NextResponse.json({ error: 'Mensagem inválida ou muito longa.' }, { status: 400 })
  }
  const historico = sanitizeHistorico(rawHistorico)

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0)

  const [
    [{ agHoje }],
    [{ agMes }],
    [{ receitaMes }],
    [{ clientesTotal }],
    estoquesCriticos,
    ultimasOs,
  ] = await Promise.all([
    db.select({ agHoje: count() }).from(agendamentos)
      .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, hoje))),
    db.select({ agMes: count() }).from(agendamentos)
      .where(and(eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, inicioMes))),
    db.select({ receitaMes: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(eq(pagamentos.lojaId, lojaId), eq(pagamentos.status, 'pago'), gte(pagamentos.pagoEm, inicioMes))),
    db.select({ clientesTotal: count() }).from(usuarios)
      .where(and(eq(usuarios.lojaId, lojaId), eq(usuarios.role, 'cliente'))),
    db.select({ nome: produtos.nome, quantidade: estoque.quantidade, minima: estoque.quantidadeMinima })
      .from(estoque)
      .innerJoin(produtos, eq(estoque.produtoId, produtos.id))
      .where(and(eq(estoque.lojaId, lojaId),
        sql`${estoque.quantidade} <= ${estoque.quantidadeMinima} AND ${estoque.quantidadeMinima} > 0`))
      .limit(5),
    db.select({ numero: ordensServico.numero, status: ordensServico.status, total: ordensServico.total })
      .from(ordensServico)
      .where(eq(ordensServico.lojaId, lojaId))
      .orderBy(desc(ordensServico.criadoEm)).limit(5),
  ])

  const system = `Você é o Assistente TRUXZ, IA especializada em gestão de estéticas automotivas.
Responda em português brasileiro, de forma direta e prática.

DADOS DA LOJA (${agora.toLocaleDateString('pt-BR')}):
- Agendamentos hoje: ${agHoje} | este mês: ${agMes}
- Receita do mês: R$ ${parseFloat(receitaMes ?? '0').toFixed(2)}
- Total de clientes: ${clientesTotal}
- Últimas OS: ${ultimasOs.map(o => `#${o.numero} ${o.status} R$${o.total}`).join(', ') || 'nenhuma'}
- Estoque crítico: ${estoquesCriticos.length > 0 ? estoquesCriticos.map(e => `${e.nome} (${e.quantidade}/${e.minima})`).join(', ') : 'nenhum'}

Seja conciso. Dê números quando perguntado. Não invente dados além dos fornecidos acima.`

  const messages = [
    ...historico.slice(-10),
    { role: 'user' as const, content: mensagem },
  ]

  try {
    const resposta = await deepseekChat({ system, messages, maxTokens: 500 })
    return NextResponse.json({ resposta, role: 'assistant' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
