import { NextRequest, NextResponse } from 'next/server'
import { getThreadReplies } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const threadTs = searchParams.get('threadTs')

    if (!channelId || !threadTs) {
      return NextResponse.json({ error: 'Missing channelId or threadTs' }, { status: 400 })
    }

    const threadReplies = await getThreadReplies(channelId, threadTs)

    return NextResponse.json({ threadReplies })
  } catch (error) {
    console.error('Error fetching thread replies:', error)
    return NextResponse.json({ error: 'Failed to fetch thread replies' }, { status: 500 })
  }
}