import { getChannelMessages, getChannelInfo } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { channelId: string } }) {
  try {
    const { channelId } = params
    const messages = await getChannelMessages(channelId)
    const channelInfo = await getChannelInfo(channelId)

    return NextResponse.json({ messages, channelInfo })
  } catch (error) {
    console.error(`Error fetching channel ${params.channelId}:`, error)
    return NextResponse.json({ error: "Failed to fetch channel data" }, { status: 500 })
  }
}
