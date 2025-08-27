import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json() as {
    name?: string
    color?: string
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Make sure the user can only update their own tags
    const updated = await prisma.tag.update({
      where: { 
        id,
        userId: user.id // Ensure user can only update their own tags
      },
      data: {
        name: body.name ?? undefined,
        color: body.color ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update tag:', error)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}
