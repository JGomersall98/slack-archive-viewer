import { MessageSquare } from "lucide-react"
import { getChannelMessages, getChannelInfo } from "@/lib/data"
import MessageList from "./MessageList"  // <-- Import the client component

interface DmPageProps {
  params: {
    dmId: string
  }
}

// SERVER COMPONENT
export default async function DmPage({ params }: DmPageProps) {
  // Fetch data on the server
  const { dmId } = params
  const messages = await getChannelMessages(dmId)
  const channelInfo = await getChannelInfo(dmId)

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
        <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
        <h1 className="font-bold">{channelInfo?.displayName || "Direct Message"}</h1>
      </div>

      {/* 
        Pass the grouped messages to the client component.
        Use key={dmId} to re-mount on each new DM click.
      */}
      <MessageList key={dmId} dmId={dmId} messagesByDate={messagesByDate} />
    </div>
  )
}
