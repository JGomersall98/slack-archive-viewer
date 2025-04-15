import { getChannelList } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const channels = await getChannelList()
    return NextResponse.json(channels)
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}
