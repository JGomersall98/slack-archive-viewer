import { NextRequest, NextResponse } from 'next/server'
import { getUserProfiles } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const userIds = searchParams.get('userIds')?.split(',') || []

    if (!channelId || userIds.length === 0) {
      return NextResponse.json({ error: 'Missing channelId or userIds' }, { status: 400 })
    }

    const userProfiles = await getUserProfiles(channelId, userIds)

    return NextResponse.json({ userProfiles })
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
  }
}