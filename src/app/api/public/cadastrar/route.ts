export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { lojas, usuarios, planos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'
import { enviarEmail } from '@/lib/mailer'
import { criarClienteAsaas, criarAssinaturaAsaas } from '@/lib/asaas'

const schema = z.object({
  // Dados da loja
  nomeLoja:   z.string().min(2).max(200),
  email:      z.string().email(),
  telefone:   z.string().optional(),
  cidade:     z.string().optional(),
  estado:     z.string().length(2).optional(),
  planoId:    z.string().uuid().optional(),
  // Dados do admin
  adminNome:  z.string().min(2),
  adminEmail: z.string().email(),
  adminSenha: z.string().min(6),
  // Pagamento
  metodoPagamento: z.enum(['trial', 'pix', 'boleto']).default('trial'),
})

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'truxz.com.br'
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://truxz.com.br'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
  }

  const d = parsed.data

  // Verifica se email já cadastrado
  const [existeAdmin] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, d.adminEmail.toLowerCase()))
    .limit(1)

  if (existeAdmin) {
    return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 409 })
  }

  // Gera slug único
  let slug = slugify(d.nomeLoja)
  const [slugExiste] = await db.select({ id: lojas.id }).from(lojas).where(eq(lojas.slug, slug)).limit(1)
  if (slugExiste) slug = `${slug}-${Date.now().toString(36)}`

  // Busca plano (ou usa básico como padrão)
  let planoId = d.planoId
  if (!planoId) {
    const [planoPadrao] = await db.select({ id: planos.id }).from(planos).where(eq(planos.tipo, 'basico')).limit(1)
    planoId = planoPadrao?.id
  }

  // Trial de 14 dias
  const trialExpira = new Date()
  trialExpira.setDate(trialExpira.getDate() + 14)

  // Cria loja
  const [loja] = await db.insert(lojas).values({
    nome:          d.nomeLoja,
    slug,
    email:         d.email,
    telefone:      d.telefone,
    cidade:        d.cidade,
    estado:        d.estado,
    planoId,
    status:        'trial',
    trialExpiraEm: trialExpira,
    corPrimaria:   '#ea580c',
    configuracoes: {
      horarioAbertura:      '08:00',
      horarioFechamento:    '18:00',
      diasFuncionamento:    [1, 2, 3, 4, 5, 6],
      intervaloAgendamento: 60,
      mensagemBoasVindas:   `Bem-vindo à ${d.nomeLoja}! Agende seu serviço.`,
      notificacaoWhatsapp:  false,
      whatsapp:             d.telefone ?? '',
    },
  }).returning()

  // Cria admin da loja
  const senhaHash = await bcrypt.hash(d.adminSenha, 10)
  await db.insert(usuarios).values({
    lojaId:   loja.id,
    nome:     d.adminNome,
    email:    d.adminEmail.toLowerCase(),
    senhaHash,
    role:     'admin_loja',
  })

  // Integração Asaas (se não for trial)
  let asaasInfo: any = null
  if (d.metodoPagamento !== 'trial' && process.env.ASAAS_API_KEY && planoId) {
    try {
      const [plano] = await db.select({ preco: planos.preco }).from(planos).where(eq(planos.id, planoId)).limit(1)

      const clienteAsaas = await criarClienteAsaas({
        name:  d.adminNome,
        email: d.adminEmail,
        phone: d.telefone,
      })

      const nextDueDate = new Date()
      nextDueDate.setDate(nextDueDate.getDate() + 14)

      const assinatura = await criarAssinaturaAsaas({
        customer:    clienteAsaas.id,
        billingType: d.metodoPagamento === 'pix' ? 'PIX' : 'BOLETO',
        value:       parseFloat(plano?.preco ?? '0'),
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle:       'MONTHLY',
        description: `TRUXZ — ${d.nomeLoja}`,
      })

      await db.update(lojas)
        .set({ asaasSubscriptionId: assinatura.id })
        .where(eq(lojas.id, loja.id))

      asaasInfo = assinatura
    } catch (e) {
      console.error('[CADASTRO] Erro Asaas:', e)
      // Continua sem pagamento — admin pode regularizar depois
    }
  }

  // Envia email de boas-vindas
  const linkAdmin = `https://${slug}.${BASE_DOMAIN}/login`
  await enviarEmail({
    para:    d.adminEmail,
    assunto: `🚗 Sua loja "${d.nomeLoja}" está pronta! — TRUXZ`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:0">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
          <div style="background:#ea580c;padding:32px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🚗 TRUXZ</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Sua loja está no ar!</h2>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
              Olá, <strong>${d.adminNome}</strong>! A loja <strong>${d.nomeLoja}</strong> foi criada com sucesso.
              Você tem <strong>14 dias de trial gratuito</strong>.
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 8px;font-size:13px;color:#374151"><strong>🌐 Seu link público:</strong></p>
              <a href="https://${slug}.${BASE_DOMAIN}" style="color:#ea580c;font-weight:700">
                https://${slug}.${BASE_DOMAIN}
              </a>
              <p style="margin:16px 0 8px;font-size:13px;color:#374151"><strong>🔐 Painel admin:</strong></p>
              <a href="${linkAdmin}" style="color:#ea580c;font-weight:700">${linkAdmin}</a>
              <p style="margin:16px 0 8px;font-size:13px;color:#374151"><strong>📧 Email:</strong> ${d.adminEmail}</p>
              <p style="margin:0;font-size:13px;color:#374151"><strong>🔑 Senha:</strong> a que você cadastrou</p>
            </div>
            <a href="${linkAdmin}" style="display:inline-block;background:#ea580c;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">
              Acessar meu painel
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  }).catch(e => console.error('[CADASTRO] Email falhou:', e))

  return NextResponse.json({
    ok: true,
    loja: {
      id:        loja.id,
      slug,
      nome:      d.nomeLoja,
      linkPublico: `https://${slug}.${BASE_DOMAIN}`,
      linkAdmin,
      trial:     true,
      trialExpira: trialExpira.toISOString(),
    },
    asaas: asaasInfo,
  }, { status: 201 })
}
