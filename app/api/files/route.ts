import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

// GET /api/files?userDir=Matthew%20Wray&id=F08LFDFAMFY&filename=8D31F774-CD63-4CEB-BB39-E3A36BA701C3.jpg
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userDir = searchParams.get("userDir") // e.g. "Matthew Wray" or "team-dwp-support"
    const fileId = searchParams.get("id") // e.g. "F08LFDFAMFY"
    const filename = searchParams.get("filename") // e.g. "8D31F774-CD63-4CEB-BB39-E3A36BA701C3.jpg"

    if (!userDir || !fileId || !filename) {
      return NextResponse.json({ error: "Missing file parameters" }, { status: 400 })
    }

    // Build the absolute path to the local file
    // Try multiple possible paths to find the file
    const possiblePaths = [
      // Standard user path
      path.join(process.cwd(), "data", userDir, "__uploads", fileId, filename),
      // Channel path
      path.join(process.cwd(), "data", userDir, "_uploads", fileId, filename),
      // Alternative channel path
      path.join(process.cwd(), "data", userDir, userDir, "_uploads", fileId, filename),
      // Another possible path structure
      path.join(process.cwd(), "data", userDir, userDir, "__uploads", fileId, filename),
    ]

    // Find the first path that exists
    let filePath = null
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath
        break
      }
    }

    // If no valid path found
    if (!filePath) {
      console.error(`File not found. Tried paths:`, possiblePaths)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file from disk
    const fileBuffer = fs.readFileSync(filePath)

    // Infer content type (simplified).
    // In production, you might use "mime" package to detect MIME from extension
    let contentType = "application/octet-stream"
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg"
    } else if (filename.endsWith(".png")) {
      contentType = "image/png"
    } else if (filename.endsWith(".gif")) {
      contentType = "image/gif"
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
      },
    })
  } catch (error) {
    console.error("Error serving local file:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
