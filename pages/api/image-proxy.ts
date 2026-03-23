import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// In-memory cache for image metadata (not the image data — to avoid OOM)
const metaCache = new Map<string, { contentType: string; etag: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 2000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  // Only allow https URLs — broad enough for all Printify CDN subdomains
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:') {
      return res.status(403).json({ error: 'Only HTTPS URLs are allowed' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  // Check ETag for conditional requests
  const clientEtag = req.headers['if-none-match']
  const cached = metaCache.get(url)
  if (cached && clientEtag && clientEtag === cached.etag && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.setHeader('ETag', cached.etag)
    return res.status(304).end()
  }

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnhingedOne-ImageProxy/1.0)',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      maxRedirects: 5,
    })

    const contentType = response.headers['content-type'] || 'image/jpeg'
    const contentLength = response.headers['content-length']
    const etag = response.headers['etag'] || `"${Date.now().toString(36)}"`

    // Cache metadata
    if (metaCache.size >= MAX_CACHE_ENTRIES) {
      // Evict oldest entry
      const oldestKey = metaCache.keys().next().value
      if (oldestKey) metaCache.delete(oldestKey)
    }
    metaCache.set(url, { contentType, etag, timestamp: Date.now() })

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    res.setHeader('ETag', etag)
    res.setHeader('X-Cache', 'MISS')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Stream the image directly to the response (no buffering)
    response.data.pipe(res)

    response.data.on('error', (err: Error) => {
      console.error('[image-proxy] Stream error:', err.message)
      if (!res.headersSent) {
        res.status(502).end()
      }
    })
  } catch (error: any) {
    console.error('[image-proxy] Error fetching:', parsedUrl.hostname, error?.response?.status || error?.message)

    if (res.headersSent) return

    const status = error?.response?.status
    if (status === 404) {
      return res.status(404).end()
    }

    // Return placeholder SVG on failure
    const placeholder = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#1a1a2e"/>
  <text x="200" y="190" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">Image</text>
  <text x="200" y="215" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">unavailable</text>
</svg>`

    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).send(placeholder)
  }
}