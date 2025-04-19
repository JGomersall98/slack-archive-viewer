"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface MessageLoadingProps {
  name: string
  type: "channel" | "dm"
}

export function MessageLoading({ name, type }: MessageLoadingProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(timer)
          return 95
        }
        // Slow down progress as it gets higher
        const increment = Math.max(1, 10 - Math.floor(prevProgress / 10))
        return prevProgress + increment
      })
    }, 150)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex flex-col items-center justify-center space-y-4 mb-6">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            Loading {type === "channel" ? "channel" : "conversation"}: {name}
            <span className="inline-block animate-pulse">...</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {type === "channel" ? "Channels" : "Conversations"} with lots of history might take a moment
          </p>
        </div>
        <Progress value={progress} className="w-full max-w-md h-2" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
