import { useState } from 'react'

type ProductImageProps = {
  name: string
  brand?: string
  image?: string
  altSuffix?: string
  className?: string
  /** Set for above-the-fold / LCP images */
  priority?: boolean
  width?: number
  height?: number
}

function brandInitial(brand?: string, name?: string) {
  const source = brand?.trim() || name?.trim() || '?'
  return source.charAt(0).toUpperCase()
}

export default function ProductImage({
  name,
  brand,
  image,
  altSuffix = '',
  className = 'product-image',
  priority = false,
  width = 150,
  height = 150,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const alt = altSuffix ? `${name} – ${altSuffix}` : name
  const showFallback = !image || failed

  if (showFallback) {
    return (
      <div className={className} aria-hidden="true" style={{ width, height, maxWidth: width }}>
        <span className="product-image-fallback">{brandInitial(brand, name)}</span>
      </div>
    )
  }

  return (
    <div className={className} style={{ width, height, maxWidth: width }}>
      <img
        src={image}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        width={width}
        height={height}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
