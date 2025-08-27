import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user-specific tags, or create default ones if none exist
    let tags = await prisma.tag.findMany({ 
      where: { userId: user.id },
      orderBy: { name: 'asc' } 
    })

    // If no tags exist for this user, create the default set
    if (tags.length === 0) {
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

      // Create default tags for this user
      for (const tag of defaultTags) {
        await prisma.tag.create({
          data: {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            userId: user.id
          }
        })
      }

      // Fetch the newly created tags
      tags = await prisma.tag.findMany({ 
        where: { userId: user.id },
        orderBy: { name: 'asc' } 
      })
    }

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const tag = await prisma.tag.create({ 
      data: { 
        name: body.name, 
        color: body.color, 
        userId: user.id 
      } 
    })
    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
