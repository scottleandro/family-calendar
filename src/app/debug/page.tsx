import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Authentication Status:</h2>
          <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
          <p>User ID: {user?.id || 'None'}</p>
          <p>Email: {user?.email || 'None'}</p>
          <p>Error: {error?.message || 'None'}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
          <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
        </div>
      </div>
    </div>
  )
}
