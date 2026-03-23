import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { PrintifyProduct } from '../utils/printify'
import { getProxyImageUrl } from '../utils/imageProxy'

const SHOP_ID = '13337182'
const PROVIDER_ID = 39
const PER_PAGE = 12

const categories = [
  { id: 'all', name: 'All Products', tags: [] },
  { id: 'tshirts', name: 'T-Shirts', tags: ['T-shirts'] },
  { id: 'sweatshirts', name: 'Sweatshirts', tags: ['Sweatshirts'] },
  { id: 'hoodies', name: 'Hoodies', tags: ['Hoodies'] },
  { id: 'stickers', name: 'Stickers', tags: ['Kiss-Cut Stickers', 'Laptop Stickers', 'Stickers'] },
  { id: 'art', name: 'Wall Art', tags: ['Unique Wall Art', 'Room Decor', 'Rage Room Art'] },
]

type Img = { src: string; alt: string; position: string; is_default: boolean }
type Product = Pick<PrintifyProduct, 'id' | 'title' | 'tags'> & { images: Img[]; print_provider_id: number; created_at: string }

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const src = product.images?.[0]?.src

  return (
    <div className="product-card fade-up" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="product-card-image">
        {!imgLoaded && !imgError && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        {src && !imgError ? (
          <img
            src={getProxyImageUrl(src)}
            alt={product.title}
            loading="lazy"
            className={imgLoaded ? 'loaded' : ''}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        {product.images?.length > 0 && (
          <span className="img-count-badge">{product.images.length} imgs</span>
        )}
      </div>
      <div className="product-card-body">
        <p className="product-card-title">{product.title}</p>
        <div className="product-card-meta">
          {product.tags?.[0] && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              {product.tags[0]}
            </span>
          )}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loadProducts = useCallback(async (page = currentPage) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/products?shopId=${SHOP_ID}&page=${page}&limit=${PER_PAGE}&providerId=${PROVIDER_ID}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProducts(data.data || [])
      setTotalProducts(data.total || 0)
      setTotalPages(data.last_page || 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => { loadProducts(currentPage) }, [currentPage, categoryFilter])

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchCat = true
    if (categoryFilter !== 'all') {
      const cat = categories.find(c => c.id === categoryFilter)
      if (cat && cat.tags.length > 0) {
        matchCat = cat.tags.some(ct => p.tags?.some(pt => pt.toLowerCase().includes(ct.toLowerCase())))
      }
    }
    return matchSearch && matchCat
  })

  const getPageNumbers = () => {
    const max = 7
    let start = Math.max(1, currentPage - Math.floor(max / 2))
    let end = Math.min(totalPages, start + max - 1)
    if (end - start + 1 < max) start = Math.max(1, end - max + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', padding: '32px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Header skeleton */}
          <div style={{ marginBottom: 40 }}>
            <div className="skeleton" style={{ height: 32, width: 180, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: 260 }} />
          </div>
          {/* Pills skeleton */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[120, 90, 100, 95, 105, 90].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 34, width: w, borderRadius: 999 }} />
            ))}
          </div>
          {/* Grid skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Couldn't load products</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>{error}</p>
          <button onClick={() => loadProducts()} className="pill active" style={{ fontSize: '0.9rem', padding: '10px 28px' }}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Main page ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* ── Hero header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #0d0d14 0%, #1a0a2e 50%, #0d0d14 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '28px 24px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Logo + title */}
          <div>
            <img src="/logo.png" alt="Unhinged One" style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {loading ? 'Loading…' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''} · Swift Pod`}
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-box"
            />
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid view">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List view">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Category pills ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '14px 24px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1) }}
              className={`pill${categoryFilter === cat.id ? ' active' : ''}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {/* Result info */}
        {(searchTerm || categoryFilter !== 'all') && (
          <div style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
            {searchTerm && <span> for <strong style={{ color: 'var(--text-primary)' }}>"{searchTerm}"</strong></span>}
            {categoryFilter !== 'all' && <span> in <strong style={{ color: 'var(--accent)' }}>{categories.find(c => c.id === categoryFilter)?.name}</strong></span>}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1.1rem' }}>No products match your search.</p>
            <button onClick={() => { setSearchTerm(''); setCategoryFilter('all') }} className="pill" style={{ marginTop: 20 }}>
              Clear filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => router.push(`/product/${p.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => router.push(`/product/${p.id}`)} role="button"
                style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                  {p.images?.[0]?.src && (
                    <img src={getProxyImageUrl(p.images[0].src)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.images?.length || 0} mockup images</p>
                </div>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="page-btn">
              ← Prev
            </button>
            {currentPage > 4 && totalPages > 7 && (
              <>
                <button onClick={() => handlePageChange(1)} className="page-btn">1</button>
                <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
              </>
            )}
            {getPageNumbers().map(p => (
              <button key={p} onClick={() => handlePageChange(p)} className={`page-btn${p === currentPage ? ' active' : ''}`}>{p}</button>
            ))}
            {currentPage < totalPages - 3 && totalPages > 7 && (
              <>
                <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                <button onClick={() => handlePageChange(totalPages)} className="page-btn">{totalPages}</button>
              </>
            )}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="page-btn">
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
