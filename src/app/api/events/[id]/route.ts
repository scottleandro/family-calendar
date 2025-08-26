import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json() as {
    title?: string
    description?: string | null
    allDay?: boolean
    start?: string | Date
    end?: string | Date
    rrule?: string | null
    durationMinutes?: number | null
    durationDays?: number | null
    tags?: string[]
    backgroundColor?: string
    borderColor?: string
  }
  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      allDay: body.allDay ?? undefined,
      start: body.start ? new Date(body.start) : undefined,
      end: body.end ? new Date(body.end) : undefined,
      rrule: body.rrule ?? undefined,
      durationMinutes: body.durationMinutes ?? undefined,
      durationDays: body.durationDays ?? undefined,
      tags: Array.isArray(body.tags)
        ? {
            deleteMany: {},
            createMany: { data: body.tags.map((tagId) => ({ tagId })) },
          }
        : undefined,
    },
  })
  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.event.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
