import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'truxz.com.br'

function getSlugFromHost(host: string): string | null {
  const hostname = host.split(':')[0]
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const slug = hostname.replace(`.${BASE_DOMAIN}`, '')
    if (slug && slug !== 'www') return slug
  }
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace('.localhost', '')
    if (slug) return slug
  }
  return null
}

export default withAuth(
  function middleware(req) {
    const host  = req.headers.get('host') ?? ''
    const slug  = getSlugFromHost(host)
    const path  = req.nextUrl.pathname
    const token = req.nextauth.token

    // ── Rotas sempre públicas (nunca redirecionar) ────────────────────────────
    if (
      path === '/' ||
      path.startsWith('/login') ||
      path.startsWith('/cadastrar') ||
      path.startsWith('/api/health') ||
      path.startsWith('/api/public/') ||
      path.startsWith('/api/webhooks/') ||
      path.startsWith('/_next/') ||
      path.startsWith('/public/')
    ) {
      if (slug && path === '/') {
        return NextResponse.rewrite(new URL(`/${slug}`, req.url))
      }
      return NextResponse.next()
    }

    // ── Subdomínio detectado: reescreve para /[slug]/... ─────────────────────
    if (slug) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return NextResponse.next()
    }

    // ── Domínio principal: lógica de roles ───────────────────────────────────
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const role = token.role as string

    if (path.startsWith('/master')      && role !== 'master') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (path.startsWith('/admin')       && !['admin_loja', 'master'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (path.startsWith('/operacional') && !['operador', 'admin_loja', 'master'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    pages: { signIn: '/login' },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Rotas públicas — sempre autoriza
        if (
          path.startsWith('/login') ||
          path.startsWith('/cadastrar') ||
          path.startsWith('/api/public/') ||
          path.startsWith('/api/webhooks/') ||
          path.startsWith('/api/health') ||
          path.startsWith('/_next/') ||
          path === '/'
        ) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.json).*)',
  ],
}
