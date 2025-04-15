"use client"

import React, { useRef, useEffect } from "react"
import Message from "@/components/message"

interface MessageListProps {
  channelId: string
  messagesByDate: Record<string, any[]>
}

export default function MessageList({ channelId, messagesByDate }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on mount or when channelId changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [channelId, messagesByDate])

  // Sort dates ascending (oldest date first)
  const sortedDates = Object.keys(messagesByDate).sort()

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col">
      {sortedDates.length > 0 ? (
        sortedDates.map((date) => {
          // Sort messages oldest → newest
          const sortedMsgs = [...messagesByDate[date]].sort(
            (a, b) => Number.parseFloat(a.ts) - Number.parseFloat(b.ts),
          )

          return (
            <div key={date}>
              {sortedMsgs.map((msg, index) => {
                const showDate = index === 0
                return (
                  <Message
                    key={msg.ts}
                    message={msg}
                    showDate={showDate}
                  />
                )
              })}
            </div>
          )
        })
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No messages found in this channel
        </div>
      )}
    </div>
  )
}
