import fs from "fs"
import path from "path"

/**
 * Recursively find all files within a directory that match a file ID
 */
export function findFilesByIdRecursive(rootDir: string, fileId: string, maxDepth = 5, currentDepth = 0): string[] {
  const results: string[] = []

  if (currentDepth > maxDepth) return results

  try {
    if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
      return results
    }

    const entries = fs.readdirSync(rootDir)

    // Check if this directory contains the file ID
    if (entries.includes(fileId)) {
      const filePath = path.join(rootDir, fileId)
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          // Get all files in this directory
          const filesInDir = fs.readdirSync(filePath)
          filesInDir.forEach((file) => {
            results.push(path.join(filePath, file))
          })
        } else {
          results.push(filePath)
        }
      }
    }

    // Recursively check subdirectories
    entries.forEach((entry) => {
      const entryPath = path.join(rootDir, entry)
      if (fs.statSync(entryPath).isDirectory()) {
        results.push(...findFilesByIdRecursive(entryPath, fileId, maxDepth, currentDepth + 1))
      }
    })
  } catch (e) {
    console.error(`Error scanning directory ${rootDir}:`, e)
  }

  return results
}

/**
 * Find all files with a specific ID anywhere in the data directory
 */
export function findFilesByIdInData(fileId: string): string[] {
  const dataDir = path.join(process.cwd(), "data")
  return findFilesByIdRecursive(dataDir, fileId)
}
