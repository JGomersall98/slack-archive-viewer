'use client'

import { X } from "lucide-react"
import Message from "./message"
import { useState, useRef, useEffect } from "react"

interface ThreadModalProps {
  isOpen: boolean
  onClose: () => void
  parentMessage: any
  threadReplies: any[]
  channelName: string
  // When provided, the modal should scroll to and highlight this reply inside the thread
  targetReplyTs?: string
}

export default function ThreadModal({ isOpen, onClose, parentMessage, threadReplies, channelName, targetReplyTs }: ThreadModalProps) {
  const [width, setWidth] = useState(384) // Default width (w-96)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  // Container for scrolling inside modal
  const contentRef = useRef<HTMLDivElement>(null)
  // Handle mouse resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      // Constrain width between 300px and 60% of screen width
      const minWidth = 300
      const maxWidth = window.innerWidth * 0.6
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      
      setWidth(constrainedWidth)
      // Update CSS variable immediately during resize for smoother experience
      document.body.style.setProperty('--thread-panel-width', `${constrainedWidth}px`)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])
  // Responsive width adjustments
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth
      let newWidth = width
      
      if (screenWidth < 768) {
        // Mobile: full width
        newWidth = screenWidth
      } else if (screenWidth < 1024) {
        // Tablet: 50% width
        newWidth = Math.min(width, screenWidth * 0.5)
      } else {
        // Desktop: constrain to max 60%
        newWidth = Math.min(width, screenWidth * 0.6)
      }
      
      if (newWidth !== width) {
        setWidth(newWidth)
        // Update CSS variable immediately for responsive changes
        document.body.style.setProperty('--thread-panel-width', `${newWidth}px`)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width])

  // Auto-scroll to a specific reply when the modal opens or replies change
  useEffect(() => {
    if (!isOpen || !targetReplyTs) return

    // Allow time for replies to render
    const timer = setTimeout(() => {
      const el = document.getElementById(`message-${targetReplyTs}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Temporary highlight
        el.classList.add('bg-yellow-50', 'dark:bg-yellow-900')
        setTimeout(() => {
          el.classList.remove('bg-yellow-50', 'dark:bg-yellow-900')
        }, 2000)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, targetReplyTs, threadReplies])  // When the thread is open, shift the main content by the panel width.
  // We do this by toggling a body class and setting a CSS variable that CSS can consume.
  useEffect(() => {
    if (isOpen) {
      // Update CSS variable when width changes (during resize)
      document.body.style.setProperty('--thread-panel-width', `${width}px`)
    } else {
      document.body.classList.remove('thread-open')
      document.body.style.removeProperty('--thread-panel-width')
    }

    // Cleanup just in case component unmounts while open
    return () => {
      document.body.classList.remove('thread-open')
      document.body.style.removeProperty('--thread-panel-width')
    }
  }, [isOpen, width])
  // Immediate width calculation when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    const setupWidth = () => {
      const screenWidth = window.innerWidth
      let appropriateWidth = width
      
      if (screenWidth < 768) {
        // Mobile: full width
        appropriateWidth = screenWidth
      } else if (screenWidth < 1024) {
        // Tablet: 50% width
        appropriateWidth = Math.min(width, screenWidth * 0.5)
      } else {
        // Desktop: constrain to max 60%
        appropriateWidth = Math.min(width, screenWidth * 0.6)
      }
      
      // Ensure minimum width
      appropriateWidth = Math.max(300, appropriateWidth)
      
      if (appropriateWidth !== width) {
        setWidth(appropriateWidth)
      }
      
      // Force immediate CSS variable update
      document.body.style.setProperty('--thread-panel-width', `${appropriateWidth}px`)
      document.body.classList.add('thread-open')
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(setupWidth)
  }, [isOpen]) // Only depend on isOpen, not width

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop - only covers left side */}
      <div 
        className="flex-1 bg-black bg-opacity-30" 
        onClick={onClose} 
      />
      
      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 hidden md:block"
        onMouseDown={() => setIsResizing(true)}
      />
        {/* Thread panel - responsive width */}
      <div 
        className="h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700 thread-panel"
        style={{ width: `${width}px` }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thread</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{channelName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Thread content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
          {/* Parent message */}
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            <Message message={parentMessage} showDate={false} isThreadReply={false} />
          </div>

          {/* Replies - filter out the parent message if it appears in replies */}
          {threadReplies.length > 0 && (
            <div className="space-y-4">
              {threadReplies
                .filter(reply => reply.ts !== parentMessage.ts)
                .map((reply) => (
                  <div key={reply.ts} id={`message-${reply.ts}`} className="pl-0">
                    <Message
                      message={reply}
                      showDate={false}
                      isThreadReply={true}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}