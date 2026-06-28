import type { GradeLetter } from '../../data/pwoProducts'

type ScoreBadgeProps = {
  grade: GradeLetter | undefined
  score: number
  maxPoints: number
  label?: string
  compact?: boolean
  className?: string
}

/** Formel-/kvalitetsscore — alltid med tekst + karakter, ikke bare farge. */
export default function ScoreBadge({
  grade,
  score,
  maxPoints,
  label = 'Score',
  compact = false,
  className = '',
}: ScoreBadgeProps) {
  const g = grade ?? 'F'
  const aria = `${label}: ${score} av ${maxPoints}, karakter ${g}`

  if (compact) {
    return (
      <span className={`ui-score-badge ui-score-badge--compact ${className}`.trim()} aria-label={aria}>
        <span className={`grade-badge grade-${g}`} aria-hidden="true">
          {g}
        </span>
        <span className="ui-score-badge-value">
          {score}/{maxPoints}
        </span>
      </span>
    )
  }

  return (
    <div className={`ui-score-badge ${className}`.trim()} role="group" aria-label={aria}>
      <span className={`grade-badge grade-${g}`} aria-hidden="true">
        {g}
      </span>
      <div className="ui-score-badge-text">
        <strong>
          {label}: {score}/{maxPoints}
        </strong>
        <span>Karakter {g}</span>
      </div>
    </div>
  )
}
