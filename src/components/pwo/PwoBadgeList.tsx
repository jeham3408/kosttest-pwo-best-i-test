import type { ProductBadge } from '../../data/badges/types'

export default function PwoBadgeList({
  badges,
  compact = false,
}: {
  badges: ProductBadge[]
  compact?: boolean
}) {
  if (!badges.length) return null
  const visible = compact ? badges.slice(0, 2) : badges
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
