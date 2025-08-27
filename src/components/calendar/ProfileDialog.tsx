'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

interface UserProfile {
  id: string
  userId: string
  email: string
  passwordExpiresAt: string
  passwordChangeRequired: boolean
  isPasswordExpired: boolean
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  // Load user profile when dialog opens
  useEffect(() => {
    if (open) {
      loadProfile()
    }
  }, [open])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      } else {
        console.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createSupabaseBrowserClient()
      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Logout error:', error)
          alert('Failed to log out. Please try again.')
          return
        }
      }
      
      // Redirect to sign-in page
      router.replace('/auth/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleChangePassword = () => {
    onOpenChange(false)
    router.push('/auth/change-password')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute left-1/2 top-1/2 w-[400px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Profile</h2>
          <button 
            onClick={() => onOpenChange(false)} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          ) : profile ? (
            <>
              {/* User Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">{profile.userId}</p>
                </div>
              </div>

              {/* Password Info */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Password Security</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Password expires:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(profile.passwordExpiresAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Days remaining:</span>
                    <span className={`text-sm font-medium ${
                      profile.isPasswordExpired ? 'text-red-600' : 
                      getDaysUntilExpiry(profile.passwordExpiresAt) <= 3 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {profile.isPasswordExpired ? 'Expired' : `${getDaysUntilExpiry(profile.passwordExpiresAt)} days`}
                    </span>
                  </div>
                </div>
                
                {(profile.isPasswordExpired || getDaysUntilExpiry(profile.passwordExpiresAt) <= 7) && (
                  <div className={`p-3 rounded-lg ${
                    profile.isPasswordExpired ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                  }`}>
                    <p className={`text-sm ${
                      profile.isPasswordExpired ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      {profile.isPasswordExpired ? 
                        'Your password has expired. Please change it now.' :
                        'Your password expires soon. Consider changing it.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Change Password
                </button>
                
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                >
                  {loggingOut ? 'Logging out...' : 'Log Out'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 dark:text-slate-400">Failed to load profile information.</p>
              <button
                onClick={loadProfile}
                className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
