import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { usuarios } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const [user] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, credentials.email))
          .limit(1)

        if (!user || !user.ativo) return null

        const senhaOk = await bcrypt.compare(credentials.senha, user.senhaHash)
        if (!senhaOk) return null

        // Update last access
        await db
          .update(usuarios)
          .set({ ultimoAcessoEm: new Date() })
          .where(eq(usuarios.id, user.id))

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          lojaId: user.lojaId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.lojaId = (user as any).lojaId
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.lojaId = token.lojaId as string | null
      }
      return session
    },
  },
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      lojaId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    lojaId: string | null
  }
}
