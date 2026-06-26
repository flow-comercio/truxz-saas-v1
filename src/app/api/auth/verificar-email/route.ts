export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tokens, usuarios, lojas } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { enviarEmail, emailBoasVindas } from '@/lib/mailer'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://truxz.com.br'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/login?error=TokenInvalido`)
  }

  // Busca token válido não utilizado
  const [registro] = await db
    .select()
    .from(tokens)
    .where(
      and(
        eq(tokens.token, token),
        eq(tokens.tipo, 'verificar_email'),
        isNull(tokens.usadoEm),
      )
    )
    .limit(1)

  if (!registro) {
    return NextResponse.redirect(`${BASE_URL}/login?error=TokenInvalido`)
  }

  if (registro.expiraEm < new Date()) {
    return NextResponse.redirect(`${BASE_URL}/login?error=TokenExpirado`)
  }

  // Marca token como usado
  await db
    .update(tokens)
    .set({ usadoEm: new Date() })
    .where(eq(tokens.id, registro.id))

  // Verifica o e-mail do usuário
  const [usuario] = await db
    .update(usuarios)
    .set({ emailVerificado: true })
    .where(eq(usuarios.id, registro.usuarioId))
    .returning({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email, lojaId: usuarios.lojaId })

  if (!usuario) {
    return NextResponse.redirect(`${BASE_URL}/login?error=TokenInvalido`)
  }

  // Envia e-mail de boas-vindas após confirmação
  if (usuario.lojaId) {
    const [loja] = await db
      .select({ nome: lojas.nome, slug: lojas.slug })
      .from(lojas)
      .where(eq(lojas.id, usuario.lojaId))
      .limit(1)

    if (loja) {
      await enviarEmail({
        para:    usuario.email,
        assunto: `Sua loja "${loja.nome}" está pronta! — TRUXZ`,
        html:    emailBoasVindas(usuario.nome, loja.nome, loja.slug, usuario.email),
      }).catch(e => console.error('[VERIFICAR-EMAIL] Boas-vindas falhou:', e))
    }
  }

  return NextResponse.redirect(`${BASE_URL}/login?verificado=1`)
}
