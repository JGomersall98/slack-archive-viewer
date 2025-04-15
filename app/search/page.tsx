"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Message from "@/components/message"
import Link from "next/link"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const searchResults = await response.json()
      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to perform search. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-2xl font-bold mb-4">Search Archive</h1>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search messages, files, and people"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.ts} className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 border-b">
                  <Link
                    href={result.channelType === "channel" ? `/channel/${result.channelId}` : `/dm/${result.channelId}`}
                    className="text-sm text-[#1264A3] hover:underline"
                  >
                    {result.channelName}
                  </Link>
                </div>
                <Message message={result} showDate={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            {query ? "No results found. Try a different search term." : "Enter a search term to find messages."}
          </div>
        )}
      </div>
    </div>
  )
}
