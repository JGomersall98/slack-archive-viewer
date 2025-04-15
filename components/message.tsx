import { formatDate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { MessageType } from "@/lib/types"
import MessageContent from "./message-content"

interface MessageProps {
  message: MessageType
  showDate?: boolean
}

export default function Message({ message, showDate = true }: MessageProps) {
  const { user, text, ts, user_profile } = message

  // Format timestamp
  const date = new Date(Number.parseFloat(ts) * 1000)
  const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const dateString = formatDate(date)

  // Get user display name
  const displayName = user_profile?.display_name || user_profile?.real_name || "Unknown User"

  // Get avatar
  const avatarUrl = user_profile?.image_72 || ""
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="py-1 px-4 hover:bg-gray-50">
      {showDate && (
        <div className="flex justify-center my-4">
          <div className="text-xs text-gray-500 bg-white px-2 border rounded-md">{dateString}</div>
        </div>
      )}

      <div className="flex items-start group">
        <Avatar className="h-9 w-9 mr-2 mt-0.5">
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline">
            <span className="font-bold mr-2">{displayName}</span>
            <span className="text-xs text-gray-500">{timeString}</span>
          </div>

          <MessageContent message={message} />
        </div>
      </div>
    </div>
  )
}
