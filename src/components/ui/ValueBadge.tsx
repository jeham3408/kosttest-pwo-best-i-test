import type { GradeLetter } from '../../data/pwoProducts'

type ValueBadgeProps = {
  grade: GradeLetter
  valueLabel: string
  contextLabel?: string
  compact?: boolean
}

/** Prisreferanse — visuelt skilt fra formelscore. */
export default function ValueBadge({ grade, valueLabel, contextLabel, compact = false }: ValueBadgeProps) {
  const aria = `Prisreferanse: karakter ${grade}, ${valueLabel}${contextLabel ? `. ${contextLabel}` : ''}`

  if (compact) {
    return (
      <span className="ui-value-badge ui-value-badge--compact" aria-label={aria}>
        <span className={`grade-badge grade-${grade} ui-value-badge-grade`} aria-hidden="true">
          {grade}
        </span>
        <span className="ui-value-badge-label">{valueLabel}</span>
      </span>
    )
  }

  return (
    <div className="ui-value-badge" role="group" aria-label={aria}>
      <span className="ui-value-badge-prefix">Pris</span>
      <span className={`grade-badge grade-${grade}`} aria-hidden="true">
        {grade}
      </span>
      <span className="ui-value-badge-label">{valueLabel}</span>
      {contextLabel ? <span className="ui-value-badge-context">{contextLabel}</span> : null}
    </div>
  )
}
