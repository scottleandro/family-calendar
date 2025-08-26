import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface FullCalendarTag {
  id: string
  name: string
  color: string
}

interface FullCalendarEvent {
  id: string
  title: string
  allDay: boolean
  extendedProps: {
    description?: string | null
    timezone: string
    tags: FullCalendarTag[]
  }
  rrule?: string
  duration?: { days?: number; minutes?: number }
  start?: string
  end?: string
  backgroundColor?: string
  borderColor?: string
}

export async function GET() {
  const events = await prisma.event.findMany({
    include: { tags: { include: { tag: true } } },
    orderBy: { start: 'asc' },
  })

  const data = events.map((e) => {
    const base: FullCalendarEvent = {
      id: e.id,
      title: e.title,
      allDay: e.allDay,
      extendedProps: {
        description: e.description,
        timezone: e.timeZone,
        tags: e.tags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
      },
    }
    if (e.rrule) {
      base.rrule = e.rrule
      if (e.allDay && e.durationDays) base.duration = { days: e.durationDays }
      else if (!e.allDay && e.durationMinutes) base.duration = { minutes: e.durationMinutes }
    } else {
      // Send dates in the format FullCalendar expects for the configured timezone
      base.start = e.start.toISOString()
      base.end = e.end.toISOString()
    }
    const color = e.tags[0]?.tag.color
    if (color) {
      base.backgroundColor = color
      base.borderColor = color
    }
    return base
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title: string
    description?: string | null
    start: string | Date
    end: string | Date
    allDay?: boolean
    timeZone?: string
    rrule?: string | null
    durationMinutes?: number | null
    durationDays?: number | null
    createdBy?: string
    tags?: string[]
    backgroundColor?: string
    borderColor?: string
  }

  // Default tag configuration (can be customized by frontend)
  const defaultTags = [
    { id: 'work', name: 'Work', color: '#3b82f6' },
    { id: 'personal', name: 'Personal', color: '#10b981' },
    { id: 'family', name: 'Family', color: '#f59e0b' },
    { id: 'health', name: 'Health', color: '#ef4444' },
    { id: 'education', name: 'Education', color: '#8b5cf6' },
    { id: 'travel', name: 'Travel', color: '#06b6d4' },
    { id: 'social', name: 'Social', color: '#ec4899' },
    { id: 'hobby', name: 'Hobby', color: '#84cc16' },
  ]

  // Create/update tags if they don't exist (preserve custom names if they exist)
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: { 
        color: tag.color,
        userId: body.createdBy ?? 'anonymous'
      },
      create: { 
        id: tag.id,
        name: tag.name, 
        color: tag.color, 
        userId: body.createdBy ?? 'anonymous' 
      },
    })
  }

  const created = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      start: new Date(body.start),
      end: new Date(body.end),
      allDay: !!body.allDay,
      timeZone: body.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      rrule: body.rrule ?? null,
      durationMinutes: body.durationMinutes ?? null,
      durationDays: body.durationDays ?? null,
      createdBy: body.createdBy ?? 'anonymous',
      tags: body.tags?.length ? {
        createMany: { data: body.tags.map((tagId) => ({ tagId })) },
      } : undefined,
    },
    include: { tags: true },
  })

  return NextResponse.json({ id: created.id })
}
