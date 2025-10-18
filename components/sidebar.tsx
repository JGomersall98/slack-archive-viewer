"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Hash, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import SidebarLogo from "@/components/sidebar-logo"

type Channel = {
  id: string
  name: string
  type: "channel" | "dm"
  displayName: string
}

export default function Sidebar() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [dms, setDms] = useState<Channel[]>([])
  const [filter, setFilter] = useState("")
  const [showChannels, setShowChannels] = useState(true)
  const [showDms, setShowDms] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/channels")

        if (!response.ok) {
          throw new Error("Failed to fetch channels")
        }

        const allChannels = await response.json()
        setChannels(allChannels.filter((c: Channel) => c.type === "channel"))
        setDms(allChannels.filter((c: Channel) => c.type === "dm"))
      } catch (error) {
        console.error("Error fetching channels:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannels()
  }, [])

  const filteredChannels = channels.filter((channel) => channel.name.toLowerCase().includes(filter.toLowerCase()))

  const filteredDms = dms.filter((dm) => dm.displayName.toLowerCase().includes(filter.toLowerCase()))

  return (    <div className="w-60 bg-[#3F0E40] dark:bg-[#19171D] text-white flex flex-col h-full">      <div className="p-3 border-b border-[#522653] flex items-center justify-between">        <Link href="/" className="flex items-center">
          <SidebarLogo 
            src="/logos/Slack_icon_2019.svg" 
            alt="Slack" 
            className="h-6 w-6 mr-2"
          />
          <span className="font-bold text-lg">Archive</span>
        </Link>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search channels"
            className="pl-8 bg-[#522653] border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-gray-400 text-sm">Loading channels...</div>
        ) : (
          <>
            <div className="px-3 mb-2">
              <button
                className="flex items-center w-full text-sm font-medium text-gray-300 hover:text-white"
                onClick={() => setShowChannels(!showChannels)}
              >
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showChannels ? "" : "-rotate-90"}`} />
                <span>Channels</span>
              </button>

              {showChannels && (
                <ul className="mt-1 space-y-1">
                  {filteredChannels.length > 0 ? (
                    filteredChannels.map((channel) => (
                      <li key={channel.id}>
                        <Link
                          href={`/channel/${channel.id}`}
                          className={`flex items-center px-2 py-1 text-sm rounded hover:bg-[#522653] ${
                            pathname === `/channel/${channel.id}` ? "bg-[#1164A3] text-white" : "text-gray-300"
                          }`}
                        >
                          <Hash className="h-4 w-4 mr-2" />
                          <span>{channel.name}</span>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-1 text-sm text-gray-400">No channels found</li>
                  )}
                </ul>
              )}
            </div>

            <div className="px-3">
              <button
                className="flex items-center w-full text-sm font-medium text-gray-300 hover:text-white"
                onClick={() => setShowDms(!showDms)}
              >
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showDms ? "" : "-rotate-90"}`} />
                <span>Direct Messages</span>
              </button>

              {showDms && (
                <ul className="mt-1 space-y-1">
                  {filteredDms.length > 0 ? (
                    filteredDms.map((dm) => (
                      <li key={dm.id}>
                        <Link
                          href={`/dm/${dm.id}`}
                          className={`flex items-center px-2 py-1 text-sm rounded hover:bg-[#522653] ${
                            pathname === `/dm/${dm.id}` ? "bg-[#1164A3] text-white" : "text-gray-300"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span>{dm.displayName}</span>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-1 text-sm text-gray-400">No direct messages found</li>
                  )}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-[#522653]">
        <div className="flex items-center justify-between mb-2">
          <Link href="/search" className="flex-1">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#522653]">
              <Search className="h-4 w-4 mr-2" />
              <span>Search Archive</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
