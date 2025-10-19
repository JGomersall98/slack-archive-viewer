import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userDir = searchParams.get("userDir") || "Unknown"
    const channelId = searchParams.get("channelId") || ""

    // Check various possible upload folder locations
    const possibleUploadPaths = [
      // Standard user paths
      path.join(process.cwd(), "data", userDir, "__uploads"),
      path.join(process.cwd(), "data", userDir, "_uploads"),
      path.join(process.cwd(), "data", userDir, "attachments"),
      
      // Channel-specific paths
      path.join(process.cwd(), "data", userDir, channelId, "__uploads"),
      path.join(process.cwd(), "data", userDir, channelId, "_uploads"),
      
      // Nested user directory paths
      path.join(process.cwd(), "data", userDir, userDir, "__uploads"),
      path.join(process.cwd(), "data", userDir, userDir, "_uploads"),
      path.join(process.cwd(), "data", userDir, userDir, "attachments"),
    ]

    // Check if any upload folder exists and contains files
    let uploadsExist = false
    let foundPath = null

    for (const uploadPath of possibleUploadPaths) {
      if (fs.existsSync(uploadPath)) {
        try {
          const stats = fs.statSync(uploadPath)
          if (stats.isDirectory()) {
            // Check if directory has any content
            const contents = fs.readdirSync(uploadPath)
            if (contents.length > 0) {
              uploadsExist = true
              foundPath = uploadPath
              break
            }
          }
        } catch (error) {
          // Continue to next path if this one fails
          continue
        }
      }
    }

    return NextResponse.json({ 
      uploadsExist, 
      foundPath,
      checkedPaths: possibleUploadPaths
    })
  } catch (error) {
    console.error("Error checking uploads folder:", error)
    return NextResponse.json({ 
      uploadsExist: false, 
      error: "Internal Server Error" 
    }, { status: 500 })
  }
}
