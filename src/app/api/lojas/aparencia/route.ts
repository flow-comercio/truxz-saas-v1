export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  nome:          z.string().min(2).optional(),
  telefone:      z.string().optional(),
  email:         z.string().email().optional(),
  logradouro:    z.string().optional(),
  numero:        z.string().optional(),
  complemento:   z.string().optional(),
  bairro:        z.string().optional(),
  cidade:        z.string().optional(),
  estado:        z.string().max(2).optional(),
  cep:           z.string().optional(),
  corPrimaria:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  configuracoes: z.object({
    horarioAbertura:      z.string().optional(),
    horarioFechamento:    z.string().optional(),
    diasFuncionamento:    z.array(z.number()).optional(),
    intervaloAgendamento: z.number().optional(),
    mensagemBoasVindas:   z.string().optional(),
    notificacaoWhatsapp:  z.boolean().optional(),
    whatsapp:             z.string().optional(),
  }).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [loja] = await db
    .select({
      nome:          lojas.nome,
      telefone:      lojas.telefone,
      email:         lojas.email,
      logradouro:    lojas.logradouro,
      numero:        lojas.numero,
      complemento:   lojas.complemento,
      bairro:        lojas.bairro,
      cidade:        lojas.cidade,
      estado:        lojas.estado,
      cep:           lojas.cep,
      corPrimaria:   lojas.corPrimaria,
      logoUrl:       lojas.logoUrl,
      configuracoes: lojas.configuracoes,
    })
    .from(lojas)
    .where(eq(lojas.id, session.user.lojaId))
    .limit(1)

  return NextResponse.json(loja ?? null)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin_loja', 'master'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { configuracoes, ...rest } = parsed.data

  // Merge das configuracoes existentes
  let configAtual: any = {}
  if (configuracoes) {
    const [lojaAtual] = await db
      .select({ configuracoes: lojas.configuracoes })
      .from(lojas).where(eq(lojas.id, session.user.lojaId)).limit(1)
    configAtual = { ...(lojaAtual?.configuracoes ?? {}), ...configuracoes }
  }

  const [updated] = await db
    .update(lojas)
    .set({
      ...rest,
      ...(configuracoes ? { configuracoes: configAtual } : {}),
      atualizadoEm: new Date(),
    })
    .where(eq(lojas.id, session.user.lojaId))
    .returning({
      nome:        lojas.nome,
      corPrimaria: lojas.corPrimaria,
      logoUrl:     lojas.logoUrl,
    })

  return NextResponse.json(updated)
}
