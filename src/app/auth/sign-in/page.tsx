'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function SignInContent() {
  const router = useRouter()
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setLoading(false); setError('Supabase is not configured'); return }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check/create user profile for existing users
    try {
      const profileResponse = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!profileResponse.ok) {
        console.error('Failed to create/update user profile')
      }
    } catch (error) {
      console.error('Error handling user profile:', error)
    }

    setLoading(false)
    router.replace(redirect)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input className="w-full rounded border px-3 py-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full rounded bg-black text-white py-2 disabled:opacity-50" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div />}> 
      <SignInContent />
    </Suspense>
  )
}
