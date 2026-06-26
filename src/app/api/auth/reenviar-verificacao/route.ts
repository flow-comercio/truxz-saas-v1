export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tokens, usuarios, lojas } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { enviarEmail, emailVerificacaoCadastro } from '@/lib/mailer'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://truxz.com.br'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
  }

  const [usuario] = await db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email, lojaId: usuarios.lojaId, emailVerificado: usuarios.emailVerificado })
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase().trim()))
    .limit(1)

  // Responde igual mesmo se não encontrar (evita enumeração de usuários)
  if (!usuario || usuario.emailVerificado !== false) {
    return NextResponse.json({ ok: true })
  }

  let nomeLoja = 'sua loja'
  if (usuario.lojaId) {
    const [loja] = await db.select({ nome: lojas.nome }).from(lojas).where(eq(lojas.id, usuario.lojaId)).limit(1)
    if (loja) nomeLoja = loja.nome
  }

  // Invalida tokens anteriores do mesmo tipo
  await db
    .update(tokens)
    .set({ usadoEm: new Date() })
    .where(
      and(
        eq(tokens.usuarioId, usuario.id),
        eq(tokens.tipo, 'verificar_email'),
        isNull(tokens.usadoEm),
      )
    )

  // Gera novo token
  const novoToken = randomBytes(32).toString('hex')
  await db.insert(tokens).values({
    usuarioId: usuario.id,
    token:     novoToken,
    tipo:      'verificar_email',
    expiraEm:  new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  const link = `${BASE_URL}/api/auth/verificar-email?token=${novoToken}`
  await enviarEmail({
    para:    usuario.email,
    assunto: 'Confirme seu e-mail — TRUXZ',
    html:    emailVerificacaoCadastro(usuario.nome, nomeLoja, link),
  }).catch(e => console.error('[REENVIAR-VERIFICACAO] Falhou:', e))

  return NextResponse.json({ ok: true })
}
