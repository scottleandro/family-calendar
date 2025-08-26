import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Return a proxy with minimal surface to avoid runtime crashes in the client during build/SSR
    return null as unknown as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(url, anon)
}
