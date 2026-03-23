import { useState } from 'react'
import { getProxyImageUrl } from '../utils/imageProxy'

interface ProductCardProps {
  id: string
  title: string
  images: Array<{ src: string }>
  tags?: string[]
  onClick: () => void
}

export default function ProductCard({ title, images, tags, onClick }: ProductCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const src = images?.[0]?.src

  return (
    <div className="product-card fade-up" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="product-card-image">
        {!loaded && !errored && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        {src && !errored ? (
          <img
            src={getProxyImageUrl(src)}
            alt={title}
            loading="lazy"
            className={loaded ? 'loaded' : ''}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        {images?.length > 0 && (
          <span className="img-count-badge">{images.length} imgs</span>
        )}
      </div>
      <div className="product-card-body">
        <p className="product-card-title">{title}</p>
        <div className="product-card-meta">
          {tags?.[0] && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              {tags[0]}
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
