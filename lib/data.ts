import fs from "fs"
import path from "path"
import { logToFile } from "./logger"
import type { MessageType, ChannelInfo } from "./types"

// Base directory for Slack data
const DATA_DIR = path.join(process.cwd(), "data")

// Get list of all channels and DMs
export async function getChannelList(): Promise<ChannelInfo[]> {
  try {
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.error("Data directory not found:", DATA_DIR)
      return []
    }

    // Read all directories in the data folder
    const directories = fs
      .readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    const channels: ChannelInfo[] = []

    for (const dir of directories) {
      const dirPath = path.join(DATA_DIR, dir)

      // Check if there's a subdirectory with the same name (e.g., dc-developers/dc-developers/)
      const sameNameSubdir = fs.existsSync(path.join(dirPath, dir))

      if (sameNameSubdir) {
        const innerPath = path.join(dirPath, dir)
        
        // Look for actual channel/DM directories (like C02LBGZKLP4, D07ENPUC1RV)
        const innerDirs = fs
          .readdirSync(innerPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)

        for (const innerDir of innerDirs) {
          // Skip system directories
          if (innerDir.startsWith('__') || innerDir.startsWith('.')) continue
          
          const type = innerDir.startsWith("C") ? "channel" : "dm"
          
          channels.push({
            id: innerDir, // Use the actual Slack channel/DM ID
            name: dir.toLowerCase().replace(/\s+/g, "-"),
            displayName: dir,
            type,
          })
        }
      } else {
        // Check for subdirectories (original behavior for other structures)
        const innerDirs = fs
          .readdirSync(dirPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)

        if (innerDirs.length > 0) {
          const firstInnerDir = innerDirs[0]
          const type = firstInnerDir.startsWith("C") ? "channel" : "dm"

          channels.push({
            id: firstInnerDir,
            name: dir.toLowerCase().replace(/\s+/g, "-"),
            displayName: dir,
            type,
          })
        }
      }
    }

    console.log(`[Data] Discovered ${channels.length} channels`)
    return channels
  } catch (error) {
    console.error("Error getting channel list:", error)
    return []
  }
}

// Get channel info by ID
export async function getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
  const channels = await getChannelList()
  return channels.find((channel) => channel.id === channelId) || null
}

// Get messages for a specific channel
export async function getChannelMessages(channelId: string): Promise<MessageType[]> {
  try {
    // Find the directory containing this channel
    const allChannels = await getChannelList()
    const channelInfo = allChannels.find((c) => c.id === channelId)
      if (!channelInfo) {
      console.error(`[Data] Channel not found: ${channelId}`)
      return []
    }

    // Find the channel directory
    let channelDir: string | null = null
    
    // Look in all parent directories for this channel ID
    const directories = fs
      .readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    for (const dir of directories) {
      const possiblePaths = [
        path.join(DATA_DIR, dir, dir, channelId), // format: parent/parent/channelId
        path.join(DATA_DIR, dir, channelId),      // format: parent/channelId
      ]
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          channelDir = possiblePath
          break
        }
      }
      
      if (channelDir) break
    }    if (!channelDir) {
      console.error(`[Data] Channel directory not found for: ${channelId}`)
      return []
    }

    // Read all JSON files in the channel directory (skip metadata files)
    const allFiles = fs.readdirSync(channelDir)
    const jsonFiles = allFiles.filter((file) => 
      file.endsWith(".json") && 
      !["channels.json", "dms.json", "groups.json", "mpims.json", "users.json"].includes(file)
    )

    let allMessages: MessageType[] = []

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(channelDir, file)
        const fileContent = fs.readFileSync(filePath, "utf-8")

        // Trim any whitespace or unexpected characters at the end of the file
        const cleanedContent = fileContent.trim()

        const messages: MessageType[] = JSON.parse(cleanedContent)        // Removed excessive logging

        // Add channel info to each message
        const messagesWithChannel = messages.map((msg) => ({
          ...msg,
          channelId,
          channelName: channelInfo.displayName,
          channelType: channelInfo.type,
        }))

        allMessages = [...allMessages, ...messagesWithChannel]      } catch (fileError) {
        console.error(`[Data] Error parsing JSON file ${file}:`, fileError)
        // Continue with other files even if one fails
      }
    }

    // Sort messages by timestamp (newest first)
    return allMessages.sort((a, b) => Number.parseFloat(b.ts) - Number.parseFloat(a.ts))  } catch (error) {
    console.error(`[Data] Error getting messages for channel ${channelId}:`, error)
    return []
  }
}

// Group messages into threads (lightweight - only identify parents)
export async function groupMessagesIntoThreads(messages: MessageType[]): Promise<{ parentMessages: MessageType[], threadCounts: Record<string, number>, threadPreviews: Record<string, { lastReplyTs: string, uniqueUsers: { userId: string, userProfile: any }[] }> }> {
  const threadCounts: Record<string, number> = {}
  const threadPreviews: Record<string, { lastReplyTs: string, uniqueUsers: { userId: string, userProfile: any }[] }> = {}
  const parentMessages: MessageType[] = []

  // First pass: count thread replies and collect preview data
  for (const message of messages) {
    if (message.thread_ts && message.thread_ts !== message.ts) {
      // This is a reply in a thread
      threadCounts[message.thread_ts] = (threadCounts[message.thread_ts] || 0) + 1
      
      // Track preview data
      if (!threadPreviews[message.thread_ts]) {
        threadPreviews[message.thread_ts] = {
          lastReplyTs: message.ts,
          uniqueUsers: []
        }
      }
      
      // Update last reply timestamp
      if (Number.parseFloat(message.ts) > Number.parseFloat(threadPreviews[message.thread_ts].lastReplyTs)) {
        threadPreviews[message.thread_ts].lastReplyTs = message.ts
      }
      
      // Add unique users with their profiles (excluding the parent message author)
      if (!threadPreviews[message.thread_ts].uniqueUsers.some(u => u.userId === message.user)) {
        threadPreviews[message.thread_ts].uniqueUsers.push({
          userId: message.user,
          userProfile: message.user_profile
        })
      }
    } else {
      // This is either a standalone message or a thread parent
      parentMessages.push(message)
    }
  }

  // Limit unique users to first 2 for display and filter out original poster
  Object.keys(threadPreviews).forEach(threadId => {
    const parentMessage = parentMessages.find(msg => msg.ts === threadId)
    const parentUserId = parentMessage?.user
    
    threadPreviews[threadId].uniqueUsers = threadPreviews[threadId].uniqueUsers
      .filter(u => u.userId !== parentUserId) // Exclude original poster
      .slice(0, 2) // Show max 2 avatars
  })
  console.log(`[Data] Thread grouping: ${parentMessages.length} parents, ${Object.keys(threadCounts).length} threads`)

  return { parentMessages, threadCounts, threadPreviews }
}

// New function to get thread replies on-demand
export async function getThreadReplies(channelId: string, threadTs: string): Promise<MessageType[]> {
  try {
    // Get all messages for the channel
    const allMessages = await getChannelMessages(channelId)
    
    // Filter for replies to this specific thread
    const threadReplies = allMessages.filter(msg => 
      msg.thread_ts === threadTs && msg.ts !== threadTs
    )    // Sort by timestamp (oldest first)
    threadReplies.sort((a, b) => Number.parseFloat(a.ts) - Number.parseFloat(b.ts))

    return threadReplies
  } catch (error) {
    console.error(`[Data] Error getting thread replies for ${threadTs}:`, error)
    return []
  }
}

// Get user profiles for thread previews
export async function getUserProfiles(channelId: string, userIds: string[]): Promise<Record<string, any>> {
  try {
    const allMessages = await getChannelMessages(channelId)
    const userProfiles: Record<string, any> = {}
    
    // Extract user profiles from messages
    for (const msg of allMessages) {
      if (msg.user && userIds.includes(msg.user) && msg.user_profile) {
        userProfiles[msg.user] = msg.user_profile
      }
    }
    
    return userProfiles
  } catch (error) {
    console.error('Error getting user profiles:', error)
    return {}
  }
}

// Alias for getDmMessages
export async function getDmMessages(dmId: string): Promise<MessageType[]> {
  return getChannelMessages(dmId)
}

// Search messages across all channels
export async function searchMessages(query: string): Promise<MessageType[]> {
  try {
    const allChannels = await getChannelList()
    const searchResults: MessageType[] = []

    for (const channel of allChannels) {
      const messages = await getChannelMessages(channel.id)

      const matchingMessages = messages.filter((msg) => {
        // Search in message text
        if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
          return true
        }

        // Search in rich text blocks
        if (msg.blocks) {
          for (const block of msg.blocks) {
            if (block.type === "rich_text" && block.elements) {
              for (const element of block.elements) {
                if (element.type === "rich_text_section" && element.elements) {
                  for (const subElement of element.elements) {
                    if (
                      subElement.type === "text" &&
                      subElement.text &&
                      subElement.text.toLowerCase().includes(query.toLowerCase())
                    ) {
                      return true
                    }
                  }
                }
              }
            }
          }
        }

        return false
      })

      searchResults.push(...matchingMessages)
    }

    // Sort by timestamp (newest first)
    return searchResults.sort((a, b) => Number.parseFloat(b.ts) - Number.parseFloat(a.ts))
  } catch (error) {
    console.error("Error searching messages:", error)
    return []
  }
}
