import { Hash } from "lucide-react"
import { getChannelMessages, getChannelInfo, groupMessagesIntoThreads } from "@/lib/data"
import { logToFile } from "@/lib/logger"
import MessageList from "./MessageList" // <-- Import the client component

interface ChannelPageProps {
  // params may be a Promise in Next.js dynamic routes, await it before using
  params: { channelId: string } | Promise<{ channelId: string }>
}

// SERVER COMPONENT
export default async function ChannelPage({ params }: ChannelPageProps) {
  // Fetch data on the server
  const { channelId } = await params
  const messages = await getChannelMessages(channelId)
  const channelInfo = await getChannelInfo(channelId)  // Removed excessive logging - keeping only basic info
  console.log(`[Channel] Loaded ${messages.length} messages for ${channelId}`)// Group messages into threads (lightweight - just count replies)
  const { parentMessages, threadCounts, threadPreviews } = await groupMessagesIntoThreads(messages)

  // Group ONLY parent messages by date (not all messages)
  const messagesByDate = parentMessages.reduce((acc: Record<string, any[]>, msg) => {
    const ts = msg?.ts
    const date = ts ? new Date(Number.parseFloat(String(ts)) * 1000) : null
    const dateString = date && !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "unknown"
    if (!acc[dateString]) acc[dateString] = []
    acc[dateString].push(msg)
    return acc
  }, {} as Record<string, any[]>)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b p-3 flex items-center">
        <Hash className="h-5 w-5 mr-2 text-gray-500" />
        <h1 className="font-bold">{channelInfo?.name || "Unknown Channel"}</h1>
      </div>{/* 
        Pass the grouped messages to the client component.
        Use key={channelId} to ensure a re-mount if user clicks 
        another channel from the sidebar (so it auto-scrolls again).
      */}      <MessageList
        key={channelId}
        channelId={channelId}
        messagesByDate={messagesByDate}
        threadCounts={threadCounts}
        threadPreviews={threadPreviews}
        channelName={channelInfo?.name || "Unknown Channel"}
      />
    </div>
  )
}
