export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { pagamentos, agendamentos, usuarios, servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { criarClienteAsaas, criarCobrancaPix, buscarQrCodePix } from '@/lib/asaas'
import { z } from 'zod'

const schema = z.object({
  agendamentoId: z.string().uuid(),
  metodo: z.enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito']),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  // Busca agendamento
  const [ag] = await db
    .select({
      id: agendamentos.id,
      precoTotal: agendamentos.precoTotal,
      clienteId: agendamentos.clienteId,
      clienteNome: usuarios.nome,
      clienteEmail: usuarios.email,
      servicoNome: servicos.nome,
      asaasCustomerId: usuarios.asaasCustomerId,
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.clienteId, usuarios.id))
    .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
    .where(and(eq(agendamentos.id, parsed.data.agendamentoId), eq(agendamentos.lojaId, session.user.lojaId)))
    .limit(1)

  if (!ag) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  // Se pagamento em dinheiro/cartão, registra diretamente como pago
  if (parsed.data.metodo !== 'pix') {
    const [pag] = await db.insert(pagamentos).values({
      agendamentoId: ag.id,
      lojaId: session.user.lojaId,
      valor: ag.precoTotal,
      metodo: parsed.data.metodo,
      status: 'pago',
      pagoEm: new Date(),
    }).returning()

    return NextResponse.json({ pagamento: pag, pix: null })
  }

  // PIX via Asaas
  if (!process.env.ASAAS_API_KEY) {
    // Sem Asaas configurado: registra como pendente
    const [pag] = await db.insert(pagamentos).values({
      agendamentoId: ag.id,
      lojaId: session.user.lojaId,
      valor: ag.precoTotal,
      metodo: 'pix',
      status: 'pendente',
    }).returning()

    return NextResponse.json({ pagamento: pag, pix: null, aviso: 'Asaas não configurado' })
  }

  // Garante que o cliente existe no Asaas
  let asaasCustomerId = ag.asaasCustomerId
  if (!asaasCustomerId) {
    const cliente = await criarClienteAsaas({
      name: ag.clienteNome,
      email: ag.clienteEmail,
    })
    asaasCustomerId = cliente.id
    await db.update(usuarios).set({ asaasCustomerId }).where(eq(usuarios.id, ag.clienteId))
  }

  // Data de vencimento = hoje
  const vencimento = new Date()
  const dueDate = vencimento.toISOString().split('T')[0]

  // Cria cobrança PIX
  const cobranca = await criarCobrancaPix({
    customer: asaasCustomerId,
    value: parseFloat(ag.precoTotal),
    description: `${ag.servicoNome} — TRUXZ`,
    dueDate,
    externalReference: ag.id,
  })

  // Busca QR Code
  const qr = await buscarQrCodePix(cobranca.id).catch(() => null)

  // Registra pagamento
  const [pag] = await db.insert(pagamentos).values({
    agendamentoId: ag.id,
    lojaId: session.user.lojaId,
    valor: ag.precoTotal,
    metodo: 'pix',
    status: 'pendente',
    asaasPaymentId: cobranca.id,
    asaasPixQrCode: qr?.encodedImage,
    asaasPixCopiaCola: qr?.payload,
  }).returning()

  return NextResponse.json({
    pagamento: pag,
    pix: qr ? { qrCode: qr.encodedImage, copiaCola: qr.payload } : null,
  })
}
