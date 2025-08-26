import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json() as {
    name?: string
    color?: string
  }

  try {
    const updated = await prisma.tag.update({
      where: { id },
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
