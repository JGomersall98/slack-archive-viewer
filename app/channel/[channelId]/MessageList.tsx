"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Message from "@/components/message"
import { MessageLoading } from "@/components/message-loading"

interface MessageListProps {
  channelId: string
  messagesByDate: Record<string, any[]>
  threadCounts: Record<string, number>
  threadPreviews: Record<string, { lastReplyTs: string, uniqueUsers: { userId: string, userProfile: any }[] }>
  channelName: string
}

export default function MessageList({ channelId, messagesByDate, threadCounts, threadPreviews, channelName }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const messageTs = searchParams.get("messageTs")
  const openThread = searchParams.get("openThread") === "1"
  const replyTs = searchParams.get("replyTs") || undefined

  // Helper to scroll with an offset so the message sits below the header comfortably
  const scrollMessageIntoViewWithOffset = (container: HTMLElement, el: HTMLElement, offset = 148) => {
    // Compute element's offsetTop relative to the scroll container
    let y = 0
    let node: HTMLElement | null = el
    while (node && node !== container) {
      y += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    const targetTop = Math.max(0, y - offset)
    container.scrollTo({ top: targetTop, behavior: "smooth" })
  }

  // Simulate loading for better UX
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // Show loading for at least 1.5 seconds for better UX

    return () => clearTimeout(timer)
  }, [channelId])

  // Handle scrolling to the highlighted message or to the bottom
  useEffect(() => {
    if (isLoading) return

    if (messageTs && containerRef.current) {
      setHighlightedMessageId(messageTs)

      // Give time for the DOM to render
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${messageTs}`)
        if (messageElement) {
          // Scroll with a slightly larger offset and then re-assert after short delays
          scrollMessageIntoViewWithOffset(containerRef.current!, messageElement as HTMLElement, 156)
          setTimeout(() => {
            const el = document.getElementById(`message-${messageTs}`)
            if (containerRef.current && el) {
              scrollMessageIntoViewWithOffset(containerRef.current, el as HTMLElement, 156)
            }
          }, 450)
          setTimeout(() => {
            const el = document.getElementById(`message-${messageTs}`)
            if (containerRef.current && el) {
              scrollMessageIntoViewWithOffset(containerRef.current, el as HTMLElement, 156)
            }
          }, 1000)
        } else {
          // If message not found, scroll to bottom
          containerRef.current!.scrollTop = containerRef.current!.scrollHeight
        }
      }, 250)
    } else if (containerRef.current) {
      // No specific message to highlight, scroll to bottom
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [isLoading, messageTs, messagesByDate])

  if (isLoading) {
    return <MessageLoading name={channelName} type="channel" />
  }

  // Sort dates in ascending order (oldest first)
  const sortedDates = Object.keys(messagesByDate).sort()
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4">
      {sortedDates.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No messages in this channel</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          // Sort messages by timestamp (oldest first)
          const sortedMessages = [...messagesByDate[date]].sort(
            (a, b) => Number.parseFloat(a.ts) - Number.parseFloat(b.ts),
          )

          return (
            <div key={date} className="mb-6">
              <div className="flex items-center mb-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              <div className="space-y-4">
                {sortedMessages.map((message) => {
                  // Get thread reply count for this message
                  const threadReplyCount = threadCounts[message.ts] || 0
                  const threadPreview = threadPreviews[message.ts]
                  
                  const isTargetParent = messageTs === message.ts
                  const shouldAutoOpenThread = !!(isTargetParent && openThread && threadReplyCount > 0)

                  return (
                    <div
                      key={message.ts}
                      id={`message-${message.ts}`}
                      className={`${
                        highlightedMessageId === message.ts
                          ? "bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-300 pl-3 -ml-4 pr-1 py-2 rounded"
                          : ""
                      }`}
                    >
                      <Message 
                        message={message} 
                        showDate={false}
                        threadReplyCount={threadReplyCount}
                        threadPreview={threadPreview}
                        channelName={channelName}
                        openThreadOnMount={shouldAutoOpenThread}
                        targetReplyTs={replyTs}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
