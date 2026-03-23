import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { fetchProductById, PrintifyProduct, PLACEHOLDER_IMAGE } from '../../utils/printify'
import { getProxyImageUrl } from '../../utils/imageProxy'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState<PrintifyProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true)
      setError(null)
      setImgLoaded(false)
      fetchProductById(id)
        .then(data => {
          setProduct(data)
          setSelectedImage(data.images?.[0]?.src || null)
        })
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to load product'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const openInNewTab = (url: string) =>
    window.open(getProxyImageUrl(url), '_blank', 'noopener,noreferrer')

  const handleSelectImage = (src: string) => {
    setSelectedImage(src)
    setImgLoaded(false)
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="skeleton" style={{ height: 18, width: 140, marginBottom: 32, borderRadius: 6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 16 }} />
            </div>
            <div>
              <div className="skeleton" style={{ height: 24, width: '70%', marginBottom: 20 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 10 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Product not found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>{error}</p>
          <Link href="/" className="pill active" style={{ fontSize: '0.9rem', padding: '10px 28px', textDecoration: 'none' }}>
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const images = product.images || []

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* ── Nav bar ── */}
      <header style={{
        background: 'linear-gradient(135deg, #0d0d14 0%, #1a0a2e 50%, #0d0d14 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '18px 24px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Products
          </Link>
          <span style={{ color: 'var(--border)', fontSize: '1rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>
            {product.title}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* ── Title ── */}
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32, lineHeight: 1.3 }}>
          {product.title}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 40, alignItems: 'start' }}>
          {/* ── Hero image ── */}
          <div>
            <div
              onClick={() => selectedImage && openInNewTab(selectedImage)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
                aspectRatio: '1',
                position: 'relative',
                cursor: 'zoom-in',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
              <img
                key={selectedImage || ''}
                src={getProxyImageUrl(selectedImage || product.images?.[0]?.src || PLACEHOLDER_IMAGE)}
                alt={product.title}
                onLoad={() => setImgLoaded(true)}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
              {/* Open hint overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                padding: 12,
                transition: 'background 0.2s',
              }}>
                <span style={{
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
                  border: '1px solid var(--border)',
                }}>
                  Click to open full size ↗
                </span>
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {product.tags.slice(0, 6).map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.72rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                    border: '1px solid var(--border)', borderRadius: 999, padding: '3px 10px',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* ── Thumbnails panel ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                All Mockups
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>({images.length})</span>
              </h2>
            </div>

            {images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => { handleSelectImage(img.src); openInNewTab(img.src) }}
                    style={{
                      borderRadius: 10, overflow: 'hidden', aspectRatio: '1',
                      background: 'var(--bg-card)',
                      border: `1px solid ${selectedImage === img.src ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.18s, transform 0.18s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      if (selectedImage !== img.src) el.style.borderColor = 'var(--border-hover)'
                      el.style.transform = 'scale(1.03)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      if (selectedImage !== img.src) el.style.borderColor = 'var(--border)'
                      el.style.transform = 'scale(1)'
                    }}
                  >
                    <img
                      src={getProxyImageUrl(img.src)}
                      alt={`${product.title} mockup ${i + 1}`}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {selectedImage === img.src && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(124,58,237,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ background: 'var(--accent)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No mockup images available.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}