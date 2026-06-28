import type { ProductBadge } from '../../data/badges/types'

export default function PwoBadgeList({
  badges,
  compact = false,
  maxVisible,
}: {
  badges: ProductBadge[]
  compact?: boolean
  maxVisible?: number
}) {
  if (!badges.length) return null
  const limit = maxVisible ?? (compact ? 2 : badges.length)
  const visible = badges.slice(0, limit)
  return (
    <ul className={`pwo-badge-list${compact ? ' pwo-badge-list--compact' : ''}`} aria-label="Produktmerker">
      {visible.map((badge) => (
        <li key={badge.id}>
          <span className="pwo-badge" title={`${badge.explanation} ${badge.disclaimerText ?? ''}`.trim()}>
            {badge.shortLabel}
          </span>
        </li>
      ))}
    </ul>
  )
}
