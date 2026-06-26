export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { usuarios, tokens } from '@/db/schema'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  token:        z.string().min(64).max(64),
  novaSenha:    z.string().min(6),
  confirmarSenha: z.string(),
}).refine(d => d.novaSenha === d.confirmarSenha, {
  message: 'As senhas não conferem',
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
      { status: 400 }
    )
  }

  // Busca token válido (não expirado, não usado)
  const [tk] = await db
    .select({ id: tokens.id, usuarioId: tokens.usuarioId })
    .from(tokens)
    .where(and(
      eq(tokens.token, parsed.data.token),
      eq(tokens.tipo, 'recuperar_senha'),
      isNull(tokens.usadoEm),
      gt(tokens.expiraEm, new Date()),
    ))
    .limit(1)

  if (!tk) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado. Solicite um novo.' },
      { status: 400 }
    )
  }

  // Atualiza senha do usuário
  const senhaHash = await bcrypt.hash(parsed.data.novaSenha, 10)
  await db
    .update(usuarios)
    .set({ senhaHash, atualizadoEm: new Date() })
    .where(eq(usuarios.id, tk.usuarioId))

  // Marca token como usado
  await db
    .update(tokens)
    .set({ usadoEm: new Date() })
    .where(eq(tokens.id, tk.id))

  return NextResponse.json({ ok: true, message: 'Senha redefinida com sucesso!' })
}
