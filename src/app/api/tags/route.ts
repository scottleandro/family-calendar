import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const tag = await prisma.tag.create({ data: { name: body.name, color: body.color, userId: body.userId ?? 'anonymous' } })
  return NextResponse.json(tag)
}
