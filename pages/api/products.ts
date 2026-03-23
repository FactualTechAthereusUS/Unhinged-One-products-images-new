import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_BASE = 'https://api.printify.com/v1'
// Server-side only — never use NEXT_PUBLIC_ for secret tokens
const TOKEN = process.env.PRINTIFY_TOKEN

// In-memory cache per provider
const providerCache = new Map<number, { products: any[]; timestamp: number; building: boolean }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_PAGES = 5          // 5 × 50 = 250 max products per provider
const PAGE_SIZE = 50
const REQUEST_TIMEOUT = 12000 // 12s

function buildProviderCache(shopId: string, providerId: number) {
  const entry = providerCache.get(providerId)
  if (entry?.building) return // already in progress
  
  // Mark as building immediately
  providerCache.set(providerId, { products: entry?.products || [], timestamp: entry?.timestamp || 0, building: true })

  const requests = Array.from({ length: MAX_PAGES }, (_, i) =>
    axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      params: { page: i + 1, limit: PAGE_SIZE },
      timeout: REQUEST_TIMEOUT,
    })
  )

  Promise.allSettled(requests).then(results => {
    let allProducts: any[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const products = result.value.data?.data || []
        allProducts = allProducts.concat(products)
        // Stop early if a page came back empty (no more products)
        if (products.length < PAGE_SIZE) break
      }
    }

    const filtered = allProducts.filter((p: any) => p.print_provider_id === providerId)
    providerCache.set(providerId, { products: filtered, timestamp: Date.now(), building: false })
    console.log(`[products] Cached ${filtered.length} products for provider ${providerId}`)
  }).catch(err => {
    console.error('[products] Background cache build failed:', err)
    const current = providerCache.get(providerId)
    if (current) providerCache.set(providerId, { ...current, building: false })
  })
}

function optimizeProduct(product: any) {
  return {
    id: product.id,
    title: product.title,
    tags: product.tags || [],
    images: product.images ? product.images.slice(0, 4) : [],
    print_provider_id: product.print_provider_id,
    created_at: product.created_at || '',
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shopId, page = '1', limit = '12', providerId, refresh } = req.query

  if (!TOKEN) {
    return res.status(500).json({ error: 'PRINTIFY_TOKEN is not configured on the server' })
  }

  if (!shopId) {
    return res.status(400).json({ error: 'Shop ID is required' })
  }

  const targetLimit = Math.min(parseInt(limit as string) || 12, 50)
  const currentPage = Math.max(parseInt(page as string) || 1, 1)
  const targetProviderId = providerId ? parseInt(providerId as string) : null

  try {
    // Without provider filter — simple pass-through to Printify
    if (!targetProviderId) {
      const response = await axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        params: { page: currentPage, limit: targetLimit },
        timeout: REQUEST_TIMEOUT,
      })
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      return res.status(200).json(response.data)
    }

    // With provider filter — use cache
    const now = Date.now()
    const forceRefresh = refresh === 'true'
    const cached = providerCache.get(targetProviderId)
    const cacheValid = cached && cached.products.length > 0 && (now - cached.timestamp) < CACHE_DURATION && !forceRefresh

    if (!cacheValid) {
      // Kick off background cache build
      buildProviderCache(shopId as string, targetProviderId)

      // While cache builds, return page 1 from Printify directly (fast first response)
      const response = await axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        params: { page: currentPage, limit: targetLimit },
        timeout: REQUEST_TIMEOUT,
      })

      const rawProducts: any[] = response.data?.data || []
      const filtered = rawProducts.filter((p: any) => p.print_provider_id === targetProviderId)
      const optimized = filtered.map(optimizeProduct)

      res.setHeader('Cache-Control', 'public, max-age=30')
      return res.status(200).json({
        data: optimized,
        total: response.data?.total || optimized.length,
        per_page: targetLimit,
        current_page: currentPage,
        last_page: response.data?.last_page || 1,
        from: (currentPage - 1) * targetLimit + 1,
        to: (currentPage - 1) * targetLimit + optimized.length,
        cache_status: 'building',
      })
    }

    // Serve from cache with pagination
    const startIndex = (currentPage - 1) * targetLimit
    const pageProducts = cached!.products.slice(startIndex, startIndex + targetLimit)
    const totalProducts = cached!.products.length
    const totalPages = Math.ceil(totalProducts / targetLimit)

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res.status(200).json({
      data: pageProducts.map(optimizeProduct),
      total: totalProducts,
      per_page: targetLimit,
      current_page: currentPage,
      last_page: totalPages,
      from: startIndex + 1,
      to: startIndex + pageProducts.length,
      cache_status: 'hit',
    })
  } catch (error: any) {
    console.error('[products] Error:', error?.response?.status, error?.message)
    return res.status(500).json({ error: 'Failed to fetch products. Check PRINTIFY_TOKEN and shop ID.' })
  }
}