import { useState, useEffect, useCallback } from 'react'

interface UploadsCheckResult {
  uploadsExist: boolean
  isChecking: boolean
  error?: string
}

// Global cache to avoid repeated API calls for the same channel/DM
const uploadsCache = new Map<string, boolean>()
// Track ongoing requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<boolean>>()

export function useUploadsCheck(userDir: string, channelId: string): UploadsCheckResult {
  const [uploadsExist, setUploadsExist] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>()

  const cacheKey = `${userDir}-${channelId}`

  const checkUploads = useCallback(async (): Promise<boolean> => {
    // Check cache first - if we have a cached result, return immediately
    if (uploadsCache.has(cacheKey)) {
      return uploadsCache.get(cacheKey)!
    }

    // Check if there's already a pending request for this key
    if (pendingRequests.has(cacheKey)) {
      return await pendingRequests.get(cacheKey)!
    }

    // Create new request
    const requestPromise = (async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/uploads-check?userDir=${encodeURIComponent(userDir)}&channelId=${encodeURIComponent(channelId)}`)
        
        if (!response.ok) {
          throw new Error('Failed to check uploads folder')
        }

        const data = await response.json()
        const exists = data.uploadsExist || false

        // Cache the result
        uploadsCache.set(cacheKey, exists)
        return exists
      } catch (err) {
        // Cache negative result to avoid repeated failures
        uploadsCache.set(cacheKey, false)
        throw err
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey)
      }
    })()

    // Track this request
    pendingRequests.set(cacheKey, requestPromise)
    
    return await requestPromise
  }, [userDir, channelId, cacheKey])

  useEffect(() => {
    if (!userDir || !channelId) return

    // Check cache immediately - no need to make request if cached
    if (uploadsCache.has(cacheKey)) {
      setUploadsExist(uploadsCache.get(cacheKey)!)
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    setError(undefined)

    checkUploads()
      .then((exists) => {
        setUploadsExist(exists)
        setError(undefined)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUploadsExist(false)
      })
      .finally(() => {
        setIsChecking(false)
      })
  }, [userDir, channelId, cacheKey, checkUploads])

  return { uploadsExist, isChecking, error }
}
