import { getChannelList } from "@/lib/data"
import Link from "next/link"
import { Hash, MessageSquare, Clock, Users } from "lucide-react"
import Logo from "@/components/logo"

export default async function HomePage() {
  const channels = await getChannelList()
  
  // Separate channels from DMs
  const channelsList = channels.filter(c => c.type === "channel")
  const dmsList = channels.filter(c => c.type === "dm")

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">        {/* Header */}        <div className="mb-8 text-center">          <div className="flex justify-center mb-4">
            <Logo 
              src="/logos/slack-long-logo (1).png"
              alt="Slack Archive Viewer"
              className="h-12"
              fallbackText="Slack Archive"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Archive Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and search your archived Slack conversations with personal notes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Hash className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Channels</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {channelsList.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Direct Messages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dmsList.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {channels.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Channels Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Channels ({channelsList.length})
              </h2>
            </div>
            <div className="p-6">
              {channelsList.length > 0 ? (
                <div className="space-y-3">
                  {channelsList.slice(0, 8).map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/channel/${channel.id}`}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Hash className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {channel.displayName}
                      </span>
                    </Link>
                  ))}
                  {channelsList.length > 8 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                      And {channelsList.length - 8} more channels...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No channels found
                </p>
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Direct Messages ({dmsList.length})
              </h2>
            </div>
            <div className="p-6">
              {dmsList.length > 0 ? (
                <div className="space-y-3">
                  {dmsList.slice(0, 8).map((dm) => (
                    <Link
                      key={dm.id}
                      href={`/dm/${dm.id}`}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {dm.displayName}
                      </span>
                    </Link>
                  ))}
                  {dmsList.length > 8 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                      And {dmsList.length - 8} more conversations...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No direct messages found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Getting Started
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>• Click on any channel or direct message to browse conversations</li>
            <li>• Use the search feature to find specific messages across all channels</li>
            <li>• Add personal notes to important messages for future reference</li>
            <li>• View threaded conversations by clicking on thread reply counts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
