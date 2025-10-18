// Server-side logging utility for Next.js
// Only use this in server components, API routes, or server-side functions

let fs: typeof import('fs') | null = null
let path: typeof import('path') | null = null

// Dynamically import Node.js modules only on server side
async function getNodeModules() {
  if (typeof window === 'undefined') {
    if (!fs || !path) {
      fs = await import('fs')
      path = await import('path')
    }
    return { fs, path }
  }
  return { fs: null, path: null }
}

export async function logToFile(filename: string, data: any, label?: string) {
  try {
    // Only log on server side
    if (typeof window !== 'undefined') {
      console.log(`[CLIENT] ${label || 'LOG'}:`, data)
      return
    }

    const { fs, path } = await getNodeModules()
    if (!fs || !path) return

    const LOG_DIR = path.join(process.cwd(), 'logs')
    
    // Ensure logs directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString()
    const logPath = path.join(LOG_DIR, `${filename}.log`)
    const logLine = `[${timestamp}] ${label || 'LOG'}: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n\n`
    
    fs.appendFileSync(logPath, logLine)
    console.log(`Logged to ${logPath}`)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

export async function clearLogFile(filename: string) {
  try {
    if (typeof window !== 'undefined') return

    const { fs, path } = await getNodeModules()
    if (!fs || !path) return

    const LOG_DIR = path.join(process.cwd(), 'logs')
    const logPath = path.join(LOG_DIR, `${filename}.log`)
    if (fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '')
    }
  } catch (error) {
    console.error('Failed to clear log file:', error)
  }
}
