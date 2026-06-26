export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { lojas, assinaturas, pagamentos, agendamentos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createHmac } from 'crypto'

/** Valida assinatura do webhook Asaas */
function validarAssinatura(payload: string, signature: string): boolean {
  const secret = process.env.ASAAS_WEBHOOK_SECRET
  if (!secret) return false // Rejeita sem secret configurado — configure ASAAS_WEBHOOK_SECRET no .env
  const hash = createHmac('sha256', secret).update(payload).digest('hex')
  return hash === signature
}

export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const assinatura = req.headers.get('asaas-signature') ?? ''

  if (!validarAssinatura(rawBody, assinatura)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let evento: any
  try {
    evento = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { event, payment } = evento

  console.log('[ASAAS WEBHOOK]', event, payment?.id)

  switch (event) {
    // ── Pagamento confirmado ──────────────────────────────────────────────────
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      if (!payment?.id) break

      // Tenta encontrar pagamento de agendamento
      const [pag] = await db
        .select({ id: pagamentos.id, agendamentoId: pagamentos.agendamentoId, lojaId: pagamentos.lojaId })
        .from(pagamentos)
        .where(eq(pagamentos.asaasPaymentId, payment.id))
        .limit(1)

      if (pag) {
        await db.update(pagamentos)
          .set({ status: 'pago', pagoEm: new Date() })
          .where(eq(pagamentos.id, pag.id))

        // Confirma agendamento automaticamente
        if (pag.agendamentoId) {
          await db.update(agendamentos)
            .set({ status: 'confirmado', atualizadoEm: new Date() })
            .where(eq(agendamentos.id, pag.agendamentoId))
        }

        console.log('[ASAAS] Pagamento confirmado:', pag.id)
        break
      }

      // Tenta encontrar assinatura SaaS (loja pagando mensalidade)
      const [assin] = await db
        .select({ id: assinaturas.id, lojaId: assinaturas.lojaId })
        .from(assinaturas)
        .where(eq(assinaturas.asaasSubscriptionId, payment.subscription ?? ''))
        .limit(1)

      if (assin) {
        const proximoVencimento = new Date()
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)

        await db.update(assinaturas)
          .set({ status: 'pago', proximoVencimento })
          .where(eq(assinaturas.id, assin.id))

        // Ativa loja se estava suspensa
        await db.update(lojas)
          .set({ status: 'ativa' })
          .where(eq(lojas.id, assin.lojaId))

        console.log('[ASAAS] Assinatura SaaS confirmada - loja:', assin.lojaId)
      }
      break
    }

    // ── Pagamento vencido ─────────────────────────────────────────────────────
    case 'PAYMENT_OVERDUE': {
      if (!payment?.id) break

      // Pagamento de agendamento
      await db.update(pagamentos)
        .set({ status: 'vencido' })
        .where(eq(pagamentos.asaasPaymentId, payment.id))

      // Mensalidade vencida → suspende loja
      const [assin] = await db
        .select({ lojaId: assinaturas.lojaId })
        .from(assinaturas)
        .where(eq(assinaturas.asaasSubscriptionId, payment.subscription ?? ''))
        .limit(1)

      if (assin) {
        await db.update(lojas)
          .set({ status: 'suspensa' })
          .where(eq(lojas.id, assin.lojaId))

        await db.update(assinaturas)
          .set({ status: 'vencido' })
          .where(eq(assinaturas.lojaId, assin.lojaId))

        console.log('[ASAAS] Mensalidade vencida - loja suspensa:', assin.lojaId)
      }
      break
    }

    // ── Pagamento cancelado / estornado ───────────────────────────────────────
    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED': {
      if (!payment?.id) break
      await db.update(pagamentos)
        .set({ status: event === 'PAYMENT_REFUNDED' ? 'estornado' : 'cancelado' })
        .where(eq(pagamentos.asaasPaymentId, payment.id))
      break
    }

    // ── Assinatura cancelada ──────────────────────────────────────────────────
    case 'SUBSCRIPTION_DELETED': {
      const subscriptionId = payment?.subscription ?? evento?.subscription?.id
      if (!subscriptionId) break

      const [assin] = await db
        .select({ lojaId: assinaturas.lojaId })
        .from(assinaturas)
        .where(eq(assinaturas.asaasSubscriptionId, subscriptionId))
        .limit(1)

      if (assin) {
        await db.update(assinaturas)
          .set({ status: 'cancelado', canceladoEm: new Date() })
          .where(eq(assinaturas.lojaId, assin.lojaId))

        await db.update(lojas)
          .set({ status: 'inativa' })
          .where(eq(lojas.id, assin.lojaId))

        console.log('[ASAAS] Assinatura cancelada - loja inativa:', assin.lojaId)
      }
      break
    }

    default:
      console.log('[ASAAS] Evento não tratado:', event)
  }

  return NextResponse.json({ ok: true, event })
}
