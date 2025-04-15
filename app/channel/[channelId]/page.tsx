import { Hash } from "lucide-react"
import { getChannelMessages, getChannelInfo } from "@/lib/data"
import MessageList from "./MessageList"  // <-- Import the client component

interface ChannelPageProps {
  params: {
    channelId: string
  }
}

// SERVER COMPONENT
export default async function ChannelPage({ params }: ChannelPageProps) {
  // Fetch data on the server
  const { channelId } = params
  const messages = await getChannelMessages(channelId)
  const channelInfo = await getChannelInfo(channelId)

  // Group messages by date
  const messagesByDate = messages.reduce((acc: Record<string, any[]>, msg) => {
    const date = new Date(Number.parseFloat(msg.ts) * 1000)
    const dateString = date.toISOString().split("T")[0]
    if (!acc[dateString]) acc[dateString] = []
    acc[dateString].push(msg)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <Hash className="h-5 w-5 mr-2 text-gray-500" />
        <h1 className="font-bold">{channelInfo?.name || "Unknown Channel"}</h1>
      </div>

      {/* 
        Pass the grouped messages to the client component.
        Use key={channelId} to ensure a re-mount if user clicks 
        another channel from the sidebar (so it auto-scrolls again).
      */}
      <MessageList key={channelId} channelId={channelId} messagesByDate={messagesByDate} />
    </div>
  )
}
