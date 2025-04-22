import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { findFilesByIdInData } from "@/lib/file-utils"

// GET /api/files?userDir=Matthew%20Wray&id=F08LFDFAMFY&filename=8D31F774-CD63-4CEB-BB39-E3A36BA701C3.jpg
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userDir = searchParams.get("userDir") || "Unknown" // e.g. "Matthew Wray" or "team-dwp-support"
    const channelId = searchParams.get("channelId") || "" // The channel/DM ID for additional path options
    const fileId = searchParams.get("id") || "" // e.g. "F08LFDFAMFY"
    const filename = searchParams.get("filename") || "" // e.g. "8D31F774-CD63-4CEB-BB39-E3A36BA701C3.jpg"

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 })
    }

    // Debug info about what we're looking for
    console.log(`Looking for file with:`)
    console.log(`- userDir: ${userDir}`)
    console.log(`- channelId: ${channelId}`)
    console.log(`- fileId: ${fileId}`)
    console.log(`- filename: ${filename}`)

    // Build the absolute path to the local file
    // Try multiple possible paths to find the file
    const possiblePaths = [
      // Standard user paths
      path.join(process.cwd(), "data", userDir, "__uploads", fileId, filename),
      path.join(process.cwd(), "data", userDir, "_uploads", fileId, filename),

      // Channel paths
      path.join(process.cwd(), "data", userDir, userDir, "_uploads", fileId, filename),
      path.join(process.cwd(), "data", userDir, userDir, "__uploads", fileId, filename),

      // Try with channel ID
      path.join(process.cwd(), "data", userDir, channelId, "_uploads", fileId, filename),
      path.join(process.cwd(), "data", userDir, channelId, "__uploads", fileId, filename),

      // Try without filename (some exports might store just by ID)
      path.join(process.cwd(), "data", userDir, "__uploads", fileId),
      path.join(process.cwd(), "data", userDir, "_uploads", fileId),

      // Try with channel ID without filename
      path.join(process.cwd(), "data", userDir, channelId, "_uploads", fileId),
      path.join(process.cwd(), "data", userDir, channelId, "__uploads", fileId),

      // Case insensitive tests (for Mac)
      path.join(process.cwd(), "data", userDir.toLowerCase(), "__uploads", fileId, filename),
      path.join(process.cwd(), "data", userDir.toLowerCase(), "_uploads", fileId, filename),
    ]

    // Find the first path that exists
    let filePath = null
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        // If this is a directory, we need to find the file inside
        if (fs.statSync(possiblePath).isDirectory()) {
          try {
            // Try to find the file in the directory
            const filesInDir = fs.readdirSync(possiblePath)

            // If there's only one file, use that
            if (filesInDir.length === 1) {
              filePath = path.join(possiblePath, filesInDir[0])
              console.log(`Using the only file in directory: ${filePath}`)
              break
            }

            // Try to find a file with a matching name
            const matchingFile = filesInDir.find(
              (file) =>
                file.toLowerCase() === filename.toLowerCase() ||
                filename.toLowerCase().includes(file.toLowerCase()) ||
                file.toLowerCase().includes(filename.toLowerCase().split(".")[0]),
            )

            if (matchingFile) {
              filePath = path.join(possiblePath, matchingFile)
              console.log(`Found matching file: ${filePath}`)
              break
            }

            // If we have a filename but no match, try the first image file
            const imageFile = filesInDir.find(
              (file) =>
                file.toLowerCase().endsWith(".jpg") ||
                file.toLowerCase().endsWith(".jpeg") ||
                file.toLowerCase().endsWith(".png") ||
                file.toLowerCase().endsWith(".gif"),
            )

            if (imageFile) {
              filePath = path.join(possiblePath, imageFile)
              console.log(`Using first image file in directory: ${filePath}`)
              break
            }
          } catch (e) {
            console.error(`Error reading directory ${possiblePath}:`, e)
          }
        } else {
          filePath = possiblePath
          console.log(`Found file: ${filePath}`)
          break
        }
      }
    }

    // If no valid path found via direct paths, try recursive search
    if (!filePath) {
      console.log("Direct path lookup failed, trying recursive search...")
      const foundFiles = findFilesByIdInData(fileId)
      console.log(`Recursive search found ${foundFiles.length} files:`, foundFiles)

      if (foundFiles.length > 0) {
        // If we have a specific filename, try to find a match
        if (filename) {
          const matchingFile = foundFiles.find(
            (file) =>
              path.basename(file).toLowerCase() === filename.toLowerCase() ||
              filename.toLowerCase().includes(path.basename(file).toLowerCase()) ||
              path.basename(file).toLowerCase().includes(filename.toLowerCase().split(".")[0]),
          )

          if (matchingFile) {
            filePath = matchingFile
            console.log(`Found matching file via recursive search: ${filePath}`)
          }
        }

        // If no match or no filename, use the first file
        if (!filePath) {
          filePath = foundFiles[0]
          console.log(`Using first file found via recursive search: ${filePath}`)
        }
      }
    }

    // If still no valid path found
    if (!filePath) {
      console.error(`File not found. Tried paths:`, possiblePaths)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file from disk
    const fileBuffer = fs.readFileSync(filePath)

    // Infer content type (simplified).
    // In production, you might use "mime" package to detect MIME from extension
    let contentType = "application/octet-stream"
    const fileExt = path.extname(filePath).toLowerCase()
    if (fileExt === ".jpg" || fileExt === ".jpeg") {
      contentType = "image/jpeg"
    } else if (fileExt === ".png") {
      contentType = "image/png"
    } else if (fileExt === ".gif") {
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
