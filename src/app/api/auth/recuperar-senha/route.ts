export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { usuarios, tokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { enviarEmail, emailRecuperacaoSenha } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
  }

  // Busca o usuário (responde igual mesmo se não existir — evita user enumeration)
  const [usuario] = await db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email })
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase().trim()))
    .limit(1)

  if (usuario) {
    // Gera token seguro
    const token    = randomBytes(32).toString('hex')
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await db.insert(tokens).values({
      usuarioId: usuario.id,
      token,
      tipo: 'recuperar_senha',
      expiraEm,
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link    = `${baseUrl}/login/redefinir-senha?token=${token}`

    await enviarEmail({
      para: usuario.email,
      assunto: 'Redefinição de senha — TRUXZ',
      html: emailRecuperacaoSenha(usuario.nome, link),
    })
  }

  // Sempre retorna 200 para não revelar se email existe
  return NextResponse.json({
    ok: true,
    message: 'Se o email estiver cadastrado, você receberá as instruções em breve.',
  })
}
