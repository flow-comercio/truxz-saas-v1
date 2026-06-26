export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { lojas, usuarios, planos } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'
import { enviarEmail, emailVerificacaoCadastro } from '@/lib/mailer'
import { randomBytes } from 'crypto'
import { tokens } from '@/db/schema'
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

  // Cria admin da loja (emailVerificado: false até confirmar)
  const senhaHash = await bcrypt.hash(d.adminSenha, 10)
  const [novoAdmin] = await db.insert(usuarios).values({
    lojaId:          loja.id,
    nome:            d.adminNome,
    email:           d.adminEmail.toLowerCase(),
    senhaHash,
    role:            'admin_loja',
    emailVerificado: false,
  }).returning({ id: usuarios.id })

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

  // Gera token de verificação de e-mail (24h)
  const tokenVerif = randomBytes(32).toString('hex')
  await db.insert(tokens).values({
    usuarioId: novoAdmin.id,
    token:     tokenVerif,
    tipo:      'verificar_email',
    expiraEm:  new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  // Envia e-mail de confirmação
  const linkVerif = `${NEXTAUTH_URL}/api/auth/verificar-email?token=${tokenVerif}`
  await enviarEmail({
    para:    d.adminEmail,
    assunto: `Confirme seu e-mail — TRUXZ`,
    html:    emailVerificacaoCadastro(d.adminNome, d.nomeLoja, linkVerif),
  }).catch(e => console.error('[CADASTRO] Email falhou:', e))

  return NextResponse.json({
    ok:                  true,
    verificacaoPendente: true,
    loja: {
      id:          loja.id,
      slug,
      nome:        d.nomeLoja,
      linkPublico: `https://${slug}.${BASE_DOMAIN}`,
      trial:       true,
      trialExpira: trialExpira.toISOString(),
    },
    asaas: asaasInfo,
  }, { status: 201 })
}
