"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type { MessageType } from "@/lib/types";
import { usePathname } from "next/navigation";
import ImageLightbox from "./image-lightbox";

interface MessageContentProps {
  message: MessageType;
  uploadsExist?: boolean;
  userDir?: string;
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
      );
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
      );
    } else if (subElement.type === "emoji") {
      // e.g. { type: "emoji", name: "drooling_face", unicode: "1f924" }
      if (subElement.unicode) {
        // Convert hex code to native emoji
        const codepoint = Number.parseInt(subElement.unicode, 16);
        const nativeEmoji = String.fromCodePoint(codepoint);
        return <span key={idx}>{nativeEmoji}</span>;
      } else {
        // Fallback: :drooling_face:
        return <span key={idx}>:{subElement.name}:</span>;
      }
    }
    return null;
  });
}

export default function MessageContent({ message, uploadsExist = false, userDir }: MessageContentProps) {
  const { text, blocks, files } = message;
  const pathname = usePathname();
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null
  );

  // Handle image loading errors
  const handleImageError = (fileId: string) => {
    setImageError((prev) => ({ ...prev, [fileId]: true }));
  };

  // Get channelId from pathname for API requests
  const channelId = pathname.split("/").pop() || "";

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
                    );
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
                    );
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
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
          // Slack "image" block (from e.g. Giphy)
          else if (block.type === "image") {
            return (
              <div key={blockIndex} className="my-2">
                {block.title?.type === "plain_text" && (
                  <div className="text-sm text-gray-600 mb-1 dark:text-gray-300">
                    {block.title.text}
                  </div>
                )}
                <img
                  src={block.image_url || "/placeholder.svg"}
                  alt={block.alt_text || ""}
                  className="max-w-xs rounded shadow cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() =>
                    setLightbox({
                      src: block.image_url,
                      alt: block.alt_text || "",
                    })
                  }
                  onError={(e) => {
                    e.currentTarget.src = "/abstract-geometric-shapes.png";
                    e.currentTarget.alt = "Image unavailable";
                  }}
                />
              </div>
            );
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
                    return <span key={ctxIdx}>{contextEl.text}</span>;
                  }
                  if (contextEl.type === "image") {
                    return (
                      <img
                        key={ctxIdx}
                        src={contextEl.image_url || "/placeholder.svg"}
                        alt={contextEl.alt_text || ""}
                        className="h-4 w-4"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/placeholder.svg?height=16&width=16";
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap dark:text-white">
      {text}
      {files && files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((file: any) => {
            // Only display images if it's e.g. jpg/png/gif
            if (file.mimetype?.startsWith("image/")) {
              // If uploads don't exist, show placeholder immediately without making API request
              if (!uploadsExist) {
                return (
                  <div key={file.id} className="relative">
                    <img
                      src="/abstract-geometric-shapes.png"
                      alt="Image unavailable - no uploads folder"
                      className="max-w-xs rounded shadow"
                    />
                    <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      {file.name}
                    </div>
                  </div>
                );
              }              // Only make API request if uploads exist
              if (uploadsExist && userDir) {
                // Get the appropriate directory for this file
                const dirPath = encodeURIComponent(userDir);

                // Create the API route URL
                const routeUrl = `/api/files?userDir=${dirPath}&id=${
                  file.id
                }&filename=${encodeURIComponent(
                  file.name
                )}&channelId=${channelId}`;

                // If this image already errored, show placeholder
                if (imageError[file.id]) {
                  return (
                    <div key={file.id} className="relative">
                      <img
                        src="/abstract-geometric-shapes.png"
                        alt="Image unavailable"
                        className="max-w-xs rounded shadow"
                      />
                      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        {file.name}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={file.id} className="relative">
                    <img
                      src={routeUrl || "/placeholder.svg"}
                      alt={file.name}
                      className="max-w-xs rounded shadow cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        setLightbox({ src: routeUrl, alt: file.name })
                      }
                      onError={() => handleImageError(file.id)}
                    />
                  </div>
                );
              }
            }
            return null;
          })}
        </div>
      )}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src || "/placeholder.svg"}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
