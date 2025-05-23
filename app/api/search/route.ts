import { searchMessages } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    const results = await searchMessages(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching messages:", error)
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 })
  }
}
