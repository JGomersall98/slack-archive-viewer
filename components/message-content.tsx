"use client"

import { ExternalLink } from "lucide-react"
import type { MessageType } from "@/lib/types"

interface MessageContentProps {
  message: MessageType
}

/**
 * Renders text, link, or emoji sub-elements (common to section, preformatted, quote).
 */
function renderSubElements(elements: any[]) {
  return elements.map((subElement: any, idx: number) => {
    if (subElement.type === "text") {
      return <span key={idx}>{subElement.text}</span>
    } 
    else if (subElement.type === "link") {
      return (
        <a
          key={idx}
          href={subElement.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1264A3] hover:underline inline-flex items-center"
        >
          {subElement.text || subElement.url}
          <ExternalLink className="h-3 w-3 ml-0.5" />
        </a>
      )
    } 
    else if (subElement.type === "emoji") {
      // e.g. { type: "emoji", name: "drooling_face", unicode: "1f924" }
      if (subElement.unicode) {
        // Convert hex code to native emoji
        const codepoint = parseInt(subElement.unicode, 16)
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
                    return (
                      <div key={elementIndex}>
                        {renderSubElements(element.elements || [])}
                      </div>
                    )
                  }
                  // "rich_text_preformatted" => code blocks
                  else if (element.type === "rich_text_preformatted") {
                    return (
                      <pre
                        key={elementIndex}
                        className="bg-gray-100 p-2 rounded text-sm overflow-auto"
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
                        className="border-l-4 border-gray-300 pl-3 ml-1 text-sm text-gray-700"
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
                  <div className="text-sm text-gray-600 mb-1">
                    {block.title.text}
                  </div>
                )}
                <img
                  src={block.image_url}
                  alt={block.alt_text || ""}
                  className="max-w-xs rounded shadow"
                />
              </div>
            )
          }
          // Slack "context" block
          else if (block.type === "context") {
            return (
              <div
                key={blockIndex}
                className="flex items-center text-xs text-gray-500 space-x-2 mt-1"
              >
                {block.elements?.map((contextEl: any, ctxIdx: number) => {
                  if (contextEl.type === "mrkdwn") {
                    return <span key={ctxIdx}>{contextEl.text}</span>
                  }
                  if (contextEl.type === "image") {
                    return (
                      <img
                        key={ctxIdx}
                        src={contextEl.image_url}
                        alt={contextEl.alt_text || ""}
                        className="h-4 w-4"
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
    <div className="whitespace-pre-wrap">
      {text}

      {/* If the message has file attachments, let's display them */}
      {files && files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((file: any) => {
            // Only display images if it's e.g. jpg/png/gif
            if (file.mimetype?.startsWith("image/")) {
              // We'll build a local url to your new route:
              // e.g. /api/files?userDir=Matthew%20Wray&id=F08LFDFAMFY&filename=8D31F774-CD63-4CEB-BB39-E3A36BA701C3.jpg
              // 
              // But you need some way to figure out "userDir" from the message user,
              // or from your directory structure. 
              // For now, let's guess we store the user's real_name in userDir:
              const userDir = encodeURIComponent(message.user_profile?.real_name ?? "Unknown")
              const routeUrl = `/api/files?userDir=${userDir}&id=${file.id}&filename=${encodeURIComponent(file.name)}`

              return (
                <div key={file.id}>
                  <img
                    src={routeUrl}
                    alt={file.name}
                    className="max-w-xs rounded shadow"
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
