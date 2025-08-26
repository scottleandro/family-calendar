import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr/dist/module/types'

const PUBLIC_PATHS = ['/auth/sign-in', '/auth/sign-up', '/_next', '/favicon.ico', '/api/health']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { res.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { res.cookies.set({ name, value: '', ...options, maxAge: 0 }) },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  if (!data.user && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
