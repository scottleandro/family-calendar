import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const now = new Date()
    const isPasswordExpired = profile.passwordExpiresAt <= now

    return NextResponse.json({
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      passwordExpiresAt: profile.passwordExpiresAt,
      passwordChangeRequired: profile.passwordChangeRequired || isPasswordExpired,
      isPasswordExpired
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    // Create user profile with 15-day password expiry
    const passwordExpiresAt = new Date()
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 15)

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        email: email || user.email,
        passwordExpiresAt,
        passwordChangeRequired: false
      },
      create: {
        userId: user.id,
        email: email || user.email || '',
        passwordExpiresAt,
        passwordChangeRequired: false
      }
    })

    return NextResponse.json({
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      passwordExpiresAt: profile.passwordExpiresAt,
      passwordChangeRequired: profile.passwordChangeRequired
    })
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
