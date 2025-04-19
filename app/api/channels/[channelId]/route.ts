import { type NextRequest, NextResponse } from "next/server"
import { getChannelInfo } from "@/lib/data"

export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const channelInfo = await getChannelInfo(params.channelId)

    if (!channelInfo) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json(channelInfo)
  } catch (error) {
    console.error("Error fetching channel info:", error)
    return NextResponse.json({ error: "Failed to fetch channel info" }, { status: 500 })
  }
}
