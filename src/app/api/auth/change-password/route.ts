import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Update password in Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Update password expiry in our database (15 days from now)
    const passwordExpiresAt = new Date()
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 15)

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        passwordExpiresAt,
        passwordChangeRequired: false
      },
      create: {
        userId: user.id,
        email: user.email || '',
        passwordExpiresAt,
        passwordChangeRequired: false
      }
    })

    return NextResponse.json({ 
      message: 'Password updated successfully',
      passwordExpiresAt 
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
