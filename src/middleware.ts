import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, ROLE_ROUTES } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/exchange-rates']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rotas públicas passam livre
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Rotas de API que não são /api/auth/* passam livre por enquanto
  // (proteção granular pode ser adicionada por rota)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Verifica sessão
  const token = req.cookies.get('session')?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica role para rotas protegidas
  const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  )

  if (matchedPrefix) {
    const allowedRoles = ROLE_ROUTES[matchedPrefix]
    if (!allowedRoles.includes(session.role)) {
      // Redireciona para a home do próprio role
      const home = `/${session.role.toLowerCase()}`
      return NextResponse.redirect(new URL(home, req.url))
    }
  }

  // Injeta userId/role nos headers para uso nas API routes
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-role', session.role)
  requestHeaders.set('x-user-name', session.name)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static, _next/image, favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
