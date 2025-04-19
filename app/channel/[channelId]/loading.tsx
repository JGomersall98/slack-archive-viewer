"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Hash } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

export default function ChannelLoading() {
  const params = useParams()
  const channelId = params?.channelId as string
  const [progress, setProgress] = useState(0)
  const [channelName, setChannelName] = useState<string | null>(null)

  // Fetch channel name for better UX during loading
  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const response = await fetch(`/api/channels/${channelId}`)
        if (response.ok) {
          const data = await response.json()
          setChannelName(data.name || data.displayName || channelId)
        }
      } catch (error) {
        console.error("Error fetching channel info:", error)
      }
    }

    fetchChannelInfo()

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down progress as it gets higher to simulate real loading behavior
        const increment = Math.max(1, 10 - Math.floor(prev / 10))
        const newProgress = prev + increment
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 300)

    return () => clearInterval(interval)
  }, [channelId])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <Hash className="h-5 w-5 mr-2 text-gray-500" />
        <h1 className="font-bold">{channelName ? channelName : <Skeleton className="h-6 w-40" />}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex flex-col items-center space-y-4 max-w-md w-full">
          <div className="flex items-center space-x-2 text-lg font-medium">
            <div className="animate-pulse">
              <div className="h-2.5 w-2.5 bg-gray-500 rounded-full"></div>
            </div>
            <div className="animate-pulse delay-100">
              <div className="h-2.5 w-2.5 bg-gray-500 rounded-full"></div>
            </div>
            <div className="animate-pulse delay-200">
              <div className="h-2.5 w-2.5 bg-gray-500 rounded-full"></div>
            </div>
            <span>Loading {channelName || "channel"}</span>
          </div>

          <Progress value={progress} className="w-full h-2" />

          <p className="text-sm text-gray-500 text-center">
            Loading messages... This might take a moment for channels with a lot of history.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-2xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
