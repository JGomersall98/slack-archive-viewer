import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const DATA_DIR = path.join(process.cwd(), "data")

export async function POST(request: NextRequest) {
  try {
    const { messageTs, channelId, note } = await request.json()

    if (!messageTs || !channelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the file containing this message
    const { filePath, messages } = await findMessageFile(channelId, messageTs)
    
    if (!filePath || !messages) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }    // Update the message with the note
    const updatedMessages = messages.map((msg: any) => {
      if (msg.ts === messageTs) {
        const now = new Date().toISOString()
        return {
          ...msg,
          personal_note: note ? {
            content: note,
            created_at: msg.personal_note?.created_at || now,
            updated_at: now
          } : undefined
        }
      }
      return msg
    })

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedMessages, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

async function findMessageFile(channelId: string, messageTs: string) {
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
        // Read all JSON files in the channel directory
        const allFiles = fs.readdirSync(possiblePath)
        const jsonFiles = allFiles.filter((file) => 
          file.endsWith(".json") && 
          !["channels.json", "dms.json", "groups.json", "mpims.json", "users.json"].includes(file)
        )

        for (const file of jsonFiles) {
          const filePath = path.join(possiblePath, file)
          const fileContent = fs.readFileSync(filePath, "utf-8")
          const messages = JSON.parse(fileContent.trim())
          
          // Check if this file contains our message
          if (messages.some((msg: any) => msg.ts === messageTs)) {
            return { filePath, messages }
          }
        }
      }
    }
  }

  return { filePath: null, messages: null }
}