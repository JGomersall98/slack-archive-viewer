import { formatTimestamp } from "@/lib/utils"
import MessageContent from "./message-content"
import Notes from "./notes"
import { useEffect, useState } from "react"
import ThreadModal from "./thread-modal"

interface MessageProps {
  message: any
  showDate?: boolean
  threadReplyCount?: number
  threadPreview?: { lastReplyTs: string, uniqueUsers: { userId: string, userProfile: any }[] }
  isThreadReply?: boolean
  channelName?: string
  // New: when true, auto-open this message's thread (used when arriving from search)
  openThreadOnMount?: boolean
  // New: specific reply to scroll to inside the thread modal
  targetReplyTs?: string
  // New: uploads existence check result from parent
  uploadsExist?: boolean
  userDir?: string
}

export default function Message({ message, showDate = false, threadReplyCount = 0, threadPreview, isThreadReply = false, channelName = "", openThreadOnMount = false, targetReplyTs, uploadsExist, userDir }: MessageProps) {
  const [showThreadModal, setShowThreadModal] = useState(false)
  const [threadReplies, setThreadReplies] = useState<any[]>([])
  const [loadingThread, setLoadingThread] = useState(false)

  // Function to load thread replies when needed
  const loadThreadReplies = async () => {
    if (threadReplies.length > 0) {
      // Already loaded, just show modal
      setShowThreadModal(true)
      return
    }

    setLoadingThread(true)
    try {
      const response = await fetch(`/api/threads?channelId=${message.channelId}&threadTs=${message.ts}`)
      if (response.ok) {
        const data = await response.json()
        setThreadReplies(data.threadReplies)
        setShowThreadModal(true)
      }
    } catch (error) {
      console.error('Error loading thread replies:', error)
    } finally {
      setLoadingThread(false)
    }
  }

  // Auto-open thread when requested (e.g., from search deep link)
  useEffect(() => {
    if (openThreadOnMount && !showThreadModal) {
      loadThreadReplies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openThreadOnMount])

  const timestamp = formatTimestamp(message.ts)
  const userProfile = message.user_profile || {}
  const displayName = userProfile.display_name || userProfile.real_name || "Unknown User"
  const avatarUrl = userProfile.image_72 || "/vibrant-street-market.png"

  // Log when we fall back to "Unknown User" - client side logging only
  if (displayName === "Unknown User") {
    console.warn('[Message Component] Unknown User fallback triggered:', {
      message: {
        user: message.user,
        user_profile: message.user_profile,
        ts: message.ts,
        text: message.text?.substring(0, 100) + '...'
      },
      computedDisplayName: displayName,
      userProfile
    })
  }

  return (
    <>
      <div className={`flex items-start space-x-3 group ${isThreadReply ? 'ml-0 mt-2' : ''} max-w-full`}>
        <div className="flex-shrink-0">
          <img
            src={avatarUrl || "/placeholder.svg"}
            alt={displayName}
            className="w-9 h-9 rounded"
            width={36}
            height={36}
          />
        </div>
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center">
            <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{timestamp}</span>
          </div>
          <MessageContent message={message} uploadsExist={uploadsExist} userDir={userDir} />
          
          {/* Personal Notes */}
          <Notes message={message} />
          {/* Thread preview button - only show on parent messages with replies */}
          {threadReplyCount > 0 && !isThreadReply && (
            <button
              onClick={loadThreadReplies}
              disabled={loadingThread}
              className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
            >
              <div className="flex -space-x-1">
                {/* Show real avatars from thread preview data */}
                {threadPreview?.uniqueUsers && threadPreview.uniqueUsers.length > 0 ? (
                  threadPreview.uniqueUsers.map((user, index) => (
                    <img
                      key={user.userId}
                      src={user.userProfile?.image_72 || "/placeholder.svg"}
                      alt={user.userProfile?.display_name || user.userProfile?.real_name || "User"}
                      className="w-5 h-5 rounded border border-white dark:border-gray-900"
                      style={{ zIndex: 2 - index }}
                    />
                  ))
                ) : (
                  // Fallback to placeholder avatars
                  <>
                    <div className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-600 border border-white dark:border-gray-900"></div>
                    {threadReplyCount > 1 && (
                      <div className="w-5 h-5 rounded bg-gray-400 dark:bg-gray-500 border border-white dark:border-gray-900" style={{ zIndex: 1 }}></div>
                    )}
                  </>
                )}
              </div>
              <span>
                {loadingThread ? 'Loading...' : `${threadReplyCount} ${threadReplyCount === 1 ? 'reply' : 'replies'}`}
              </span>
              {threadPreview?.lastReplyTs && (
                <span className="text-xs text-gray-400">
                  Last reply {formatTimestamp(threadPreview.lastReplyTs)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Thread Modal */}
      <ThreadModal
        isOpen={showThreadModal}
        onClose={() => setShowThreadModal(false)}
        parentMessage={message}
        threadReplies={threadReplies}
        channelName={channelName}
        targetReplyTs={targetReplyTs}
      />
    </>
  )
}
