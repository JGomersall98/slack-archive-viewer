import { MessageSquare } from "lucide-react"
import { getChannelMessages, getChannelInfo, groupMessagesIntoThreads } from "@/lib/data"
import { logToFile } from "@/lib/logger"
import MessageList from "./MessageList" // <-- Import the client component

interface DmPageProps {
  // params may be a Promise in Next.js dynamic routes, await it before using
  params: { dmId: string } | Promise<{ dmId: string }>
}

// SERVER COMPONENT
export default async function DmPage({ params }: DmPageProps) {
  // Fetch data on the server
  const { dmId } = await params
  const messages = await getChannelMessages(dmId)
  const channelInfo = await getChannelInfo(dmId)  // Removed excessive logging - keeping only basic info
  console.log(`[DM] Loaded ${messages.length} messages for ${dmId}`)// Group messages into threads (lightweight - just count replies)
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
        <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
        <h1 className="font-bold">{channelInfo?.displayName || "Direct Message"}</h1>
      </div>

      {/* 
        Pass the grouped messages to the client component.
        Use key={dmId} to re-mount on each new DM click.
      */}      <MessageList
        key={dmId}
        dmId={dmId}
        messagesByDate={messagesByDate}
        threadCounts={threadCounts}
        dmName={channelInfo?.displayName || "Direct Message"}
      />
    </div>
  )
}
