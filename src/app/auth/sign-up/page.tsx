'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setLoading(false); setError('Supabase is not configured'); return }
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if the user was created and signed in immediately
    if (data.user && data.session) {
      // User is signed in immediately, redirect to home
      // Profile will be created by middleware/sign-in flow
      setLoading(false)
      router.replace('/')
    } else {
      // User needs to confirm email first or account created successfully
      setLoading(false)
      setError('Account created! Please check your email to confirm your account, then sign in.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign up</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input className="w-full rounded border px-3 py-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full rounded bg-black text-white py-2 disabled:opacity-50" disabled={loading}>{loading ? 'Signing up...' : 'Create account'}</button>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/sign-in" className="text-blue-600 hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </div>
  )
}
