import { useState } from 'react'

type ProductImageProps = {
  name: string
  brand?: string
  image?: string
  altSuffix?: string
  className?: string
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
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const alt = altSuffix ? `${name} – ${altSuffix}` : name
  const showFallback = !image || failed

  if (showFallback) {
    return (
      <div className={className} aria-hidden="true">
        <span className="product-image-fallback">{brandInitial(brand, name)}</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        width="150"
        height="150"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
