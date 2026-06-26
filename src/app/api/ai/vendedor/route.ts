import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deepseekChat } from '@/lib/deepseek'
import { checkRateLimit, sanitizeHistorico } from '@/lib/rate-limit'
import { db } from '@/db'
import { servicos, produtos, estoque, leads, orcamentos } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: 'IA não configurada' }, { status: 503 })

  const lojaId = session.user.lojaId!
  if (!checkRateLimit(`ai:vendedor:${session.user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const { mensagem, historico: rawHistorico = [], contextoLead } = await req.json()
  if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0 || mensagem.length > 800) {
    return NextResponse.json({ error: 'Mensagem inválida ou muito longa.' }, { status: 400 })
  }
  const historico = sanitizeHistorico(rawHistorico)

  const [servicosLoja, produtosLoja, leadsCount, orcamentosMes] = await Promise.all([
    db.select({ nome: servicos.nome, preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos })
      .from(servicos).where(and(eq(servicos.lojaId, lojaId), eq(servicos.ativo, true))),
    db.select({ nome: produtos.nome, precoVenda: produtos.precoVenda })
      .from(produtos)
      .leftJoin(estoque, and(eq(estoque.produtoId, produtos.id), eq(estoque.lojaId, lojaId)))
      .where(and(eq(produtos.lojaId, lojaId), eq(produtos.vendaAvulsa, true)))
      .limit(30),
    db.select({ total: sql<number>`COUNT(*)`, estagio: leads.estagio })
      .from(leads).where(eq(leads.lojaId, lojaId))
      .groupBy(leads.estagio),
    db.select({ total: sql<number>`COUNT(*)`, soma: sql<string>`COALESCE(SUM(total),0)` })
      .from(orcamentos)
      .where(and(eq(orcamentos.lojaId, lojaId),
        sql`criado_em >= date_trunc('month', NOW())`))
      .limit(1),
  ])

  const servicosCatalogo = servicosLoja
    .map(s => `${s.nome} R$${s.preco} (${s.duracaoMinutos}min)`)
    .join(' | ')

  const produtosCatalogo = produtosLoja
    .map(p => `${p.nome} R$${p.precoVenda}`)
    .join(' | ')

  const pipeline = leadsCount.map(l => `${l.estagio}: ${l.total}`).join(', ')

  const ctxLead = contextoLead
    ? `\nLEAD ATUAL: ${contextoLead.nome} | Veículo: ${contextoLead.veiculo || 'n/a'} | Estágio: ${contextoLead.estagio} | Valor estimado: R$${contextoLead.valorEstimado || '0'}`
    : ''

  const system = `Você é um agente de vendas IA especializado em estéticas automotivas. Ajude o vendedor a fechar mais negócios.

CATÁLOGO DE SERVIÇOS: ${servicosCatalogo}
PRODUTOS DISPONÍVEIS: ${produtosCatalogo}
PIPELINE ATUAL: ${pipeline}
ORÇAMENTOS ESSE MÊS: ${orcamentosMes[0]?.total ?? 0} orçamentos — R$${orcamentosMes[0]?.soma ?? 0}${ctxLead}

Suas habilidades de vendas:
- UPSELL: Sugira versão superior do serviço desejado (ex: "polimento básico → polimento premium com proteção cerâmica")
- DOWNSELL: Se cliente resistir ao preço, ofereça versão mais enxuta para não perder a venda
- ORDER BUMP: Sugira um adicional de baixo valor no momento do fechamento (ex: "hidratação de couro por R$30 a mais")
- CROSSSELL: Relacione serviços complementares (ex: "além da lavagem, seu carro pode precisar de vitrificação")

Regras:
- Seja direto e objetivo, máximo 4 frases
- Sempre cite valores reais do catálogo
- Sugira scripts de abordagem quando pedido
- Dê dicas táticas para avançar o lead no pipeline`

  try {
    const resposta = await deepseekChat({
      system,
      messages: [...historico.slice(-8), { role: 'user', content: mensagem }],
      maxTokens: 400,
    })
    return NextResponse.json({ resposta })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
