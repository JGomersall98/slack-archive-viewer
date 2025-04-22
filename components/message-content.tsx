"use client"

import { ExternalLink } from "lucide-react"
import { useState } from "react"
import type { MessageType } from "@/lib/types"
import { usePathname } from "next/navigation"

interface MessageContentProps {
  message: MessageType
}

/**
 * Renders text, link, or emoji sub-elements (common to section, preformatted, quote).
 */
function renderSubElements(elements: any[]) {
  return elements.map((subElement: any, idx: number) => {
    if (subElement.type === "text") {
      return (
        <span key={idx} className="dark:text-white">
          {subElement.text}
        </span>
      )
    } else if (subElement.type === "link") {
      return (
        <a
          key={idx}
          href={subElement.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1264A3] hover:underline inline-flex items-center dark:text-[#89b3d6]"
        >
          {subElement.text || subElement.url}
          <ExternalLink className="h-3 w-3 ml-0.5" />
        </a>
      )
    } else if (subElement.type === "emoji") {
      // e.g. { type: "emoji", name: "drooling_face", unicode: "1f924" }
      if (subElement.unicode) {
        // Convert hex code to native emoji
        const codepoint = Number.parseInt(subElement.unicode, 16)
        const nativeEmoji = String.fromCodePoint(codepoint)
        return <span key={idx}>{nativeEmoji}</span>
      } else {
        // Fallback: :drooling_face:
        return <span key={idx}>:{subElement.name}:</span>
      }
    }
    return null
  })
}

export default function MessageContent({ message }: MessageContentProps) {
  const { text, blocks, files } = message
  const pathname = usePathname()
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  // Extract conversation directory from the URL path
  const getConversationNameFromPath = () => {
    // For DMs: /dm/[dmId]
    // For channels: /channel/[channelId]

    try {
      const parts = pathname.split("/")
      const type = parts[1] // "dm" or "channel"
      const id = parts[2] // the ID

      if (type === "dm") {
        // Try to get DM name from message
        if (message.dmName) {
          return message.dmName
        }

        // Try to get from channelName (sometimes used for DMs)
        if (message.channelName) {
          return message.channelName
        }

        // Try to extract from the URL - this won't work directly
        // but at least we can log what we're looking for
        console.log(`Looking for DM with ID: ${id}`)
      } else if (type === "channel") {
        // For channels, use the channel name if available
        if (message.channelName) {
          return message.channelName
        }
        console.log(`Looking for channel with ID: ${id}`)
      }
    } catch (e) {
      console.error("Error parsing path:", e)
    }

    return null
  }

  // Function to determine the correct directory for file access
  const getFileDirectory = () => {
    // Get the conversation name from the path
    const conversationName = getConversationNameFromPath()

    // If we have a conversation name, use that
    if (conversationName) {
      return encodeURIComponent(conversationName)
    }

    // If this is a channel message, use the channel name
    if (message.channelType === "channel" && message.channelName) {
      return encodeURIComponent(message.channelName)
    }

    // Try to use other fields from the message
    if (message.dmName) {
      return encodeURIComponent(message.dmName)
    }

    // Last resort: use user's name or Unknown
    return encodeURIComponent(message.user_profile?.real_name ?? "Unknown")
  }

  // Handle image loading errors
  const handleImageError = (fileId: string) => {
    setImageError((prev) => ({ ...prev, [fileId]: true }))
  }

  // 1) Render Slack "blocks" if present
  if (blocks && blocks.length > 0) {
    return (
      <div className="message-content">
        {blocks.map((block: any, blockIndex: number) => {
          // Slack "rich_text" blocks
          if (block.type === "rich_text") {
            return (
              <div key={blockIndex} className="rich-text">
                {block.elements.map((element: any, elementIndex: number) => {
                  // "rich_text_section" => normal text + links + emojis
                  if (element.type === "rich_text_section") {
                    return <div key={elementIndex}>{renderSubElements(element.elements || [])}</div>
                  }
                  // "rich_text_preformatted" => code blocks
                  else if (element.type === "rich_text_preformatted") {
                    return (
                      <pre
                        key={elementIndex}
                        className="bg-gray-100 p-2 rounded text-sm overflow-auto dark:bg-gray-800 dark:text-gray-200"
                      >
                        {renderSubElements(element.elements || [])}
                      </pre>
                    )
                  }
                  // "rich_text_quote"
                  else if (element.type === "rich_text_quote") {
                    return (
                      <blockquote
                        key={elementIndex}
                        className="border-l-4 border-gray-300 pl-3 ml-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-400"
                      >
                        {renderSubElements(element.elements || [])}
                      </blockquote>
                    )
                  }
                  return null
                })}
              </div>
            )
          }
          // Slack "image" block (from e.g. Giphy)
          else if (block.type === "image") {
            return (
              <div key={blockIndex} className="my-2">
                {block.title?.type === "plain_text" && (
                  <div className="text-sm text-gray-600 mb-1 dark:text-gray-300">{block.title.text}</div>
                )}
                <img
                  src={block.image_url || "/placeholder.svg"}
                  alt={block.alt_text || ""}
                  className="max-w-xs rounded shadow"
                  onError={(e) => {
                    e.currentTarget.src = "/abstract-geometric-shapes.png"
                    e.currentTarget.alt = "Image unavailable"
                  }}
                />
              </div>
            )
          }
          // Slack "context" block
          else if (block.type === "context") {
            return (
              <div
                key={blockIndex}
                className="flex items-center text-xs text-gray-500 space-x-2 mt-1 dark:text-gray-400"
              >
                {block.elements?.map((contextEl: any, ctxIdx: number) => {
                  if (contextEl.type === "mrkdwn") {
                    return <span key={ctxIdx}>{contextEl.text}</span>
                  }
                  if (contextEl.type === "image") {
                    return (
                      <img
                        key={ctxIdx}
                        src={contextEl.image_url || "/placeholder.svg"}
                        alt={contextEl.alt_text || ""}
                        className="h-4 w-4"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=16&width=16"
                        }}
                      />
                    )
                  }
                  return null
                })}
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  // 2) If no blocks, fallback to top-level text
  //    plus check for `files` (like images in Slack exports)
  return (
    <div className="whitespace-pre-wrap dark:text-white">
      {text}

      {/* If the message has file attachments, let's display them */}
      {files && files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((file: any) => {
            // Only display images if it's e.g. jpg/png/gif
            if (file.mimetype?.startsWith("image/")) {
              // Get the appropriate directory for this file
              const dirPath = getFileDirectory()

              // Get the channel ID from the pathname for additional routing
              const channelId = pathname.split("/").pop() || ""

              // Create multiple possible routes to try
              const routeUrl = `/api/files?userDir=${dirPath}&id=${file.id}&filename=${encodeURIComponent(file.name)}&channelId=${channelId}`

              // If this image already errored, show placeholder
              if (imageError[file.id]) {
                return (
                  <div key={file.id} className="relative">
                    <img src="/abstract-geometric-shapes.png" alt="Image unavailable" className="max-w-xs rounded shadow" />
                    <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      {file.name}
                    </div>
                  </div>
                )
              }

              return (
                <div key={file.id} className="relative">
                  <img
                    src={routeUrl || "/placeholder.svg"}
                    alt={file.name}
                    className="max-w-xs rounded shadow"
                    onError={() => handleImageError(file.id)}
                  />
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
