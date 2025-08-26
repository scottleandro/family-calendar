import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr/dist/module/types'

export function createSupabaseServerClient() {
  const cookieStorePromise = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookieStorePromise
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookieStorePromise
          cookieStore.set(name, value, options)
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookieStorePromise
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}
