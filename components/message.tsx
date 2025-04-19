import { formatTimestamp } from "@/lib/utils"
import MessageContent from "./message-content"

interface MessageProps {
  message: any
  showDate?: boolean
}

export default function Message({ message, showDate = false }: MessageProps) {
  const timestamp = formatTimestamp(message.ts)
  const userProfile = message.user_profile || {}
  const displayName = userProfile.display_name || userProfile.real_name || "Unknown User"
  const avatarUrl = userProfile.image_72 || "/vibrant-street-market.png"

  return (
    <div className="flex items-start space-x-3 group">
      <div className="flex-shrink-0">
        <img
          src={avatarUrl || "/placeholder.svg"}
          alt={displayName}
          className="w-9 h-9 rounded"
          width={36}
          height={36}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{timestamp}</span>
        </div>
        <MessageContent message={message} />
      </div>
    </div>
  )
}
