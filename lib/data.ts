import fs from "fs"
import path from "path"
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
      // Extract channel name from directory name
      // Format: slackdump_YYYYMMDD_HHMMSS (name)
      const match = dir.match(/slackdump_\d+_\d+\s*$$(.+)$$/)
      const displayName = match ? match[1].trim() : dir

      // Determine if it's a channel or DM based on the first character of the inner directory
      const innerDirs = fs
        .readdirSync(path.join(DATA_DIR, dir), { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      if (innerDirs.length > 0) {
        const firstInnerDir = innerDirs[0]
        const type = firstInnerDir.startsWith("C") ? "channel" : "dm"

        channels.push({
          id: firstInnerDir,
          name: displayName.toLowerCase().replace(/\s+/g, "-"),
          displayName,
          type,
        })
      }
    }

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
      return []
    }

    // Find the parent directory
    const directories = fs
      .readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    let parentDir = ""
    for (const dir of directories) {
      const innerDirs = fs
        .readdirSync(path.join(DATA_DIR, dir), { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      if (innerDirs.includes(channelId)) {
        parentDir = dir
        break
      }
    }

    if (!parentDir) {
      return []
    }

    // Read all JSON files in the channel directory
    const channelDir = path.join(DATA_DIR, parentDir, channelId)
    const jsonFiles = fs.readdirSync(channelDir).filter((file) => file.endsWith(".json"))

    let allMessages: MessageType[] = []

    for (const file of jsonFiles) {
      const filePath = path.join(channelDir, file)
      const fileContent = fs.readFileSync(filePath, "utf-8")
      const messages: MessageType[] = JSON.parse(fileContent)

      // Add channel info to each message
      const messagesWithChannel = messages.map((msg) => ({
        ...msg,
        channelId,
        channelName: channelInfo.displayName,
        channelType: channelInfo.type,
      }))

      allMessages = [...allMessages, ...messagesWithChannel]
    }

    // Sort messages by timestamp (newest first)
    return allMessages.sort((a, b) => Number.parseFloat(b.ts) - Number.parseFloat(a.ts))
  } catch (error) {
    console.error(`Error getting messages for channel ${channelId}:`, error)
    return []
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
