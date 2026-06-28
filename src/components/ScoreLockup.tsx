import type { GradeLetter } from '../data/pwoProducts'
import { overallGradeLabels } from '../data/pwoProducts'

const gradeClass = (grade: GradeLetter | undefined) => `grade-badge grade-${grade ?? 'F'}`

type ScoreLockupProps = {
  grade?: GradeLetter
  score?: number
  maxPoints: number
  scoreLabel?: string
  compact?: boolean
  pendingLabel?: string
}

export default function ScoreLockup({
  grade,
  score,
  maxPoints,
  scoreLabel = 'Formelscore',
  compact = false,
  pendingLabel,
}: ScoreLockupProps) {
  if (pendingLabel) {
    return (
      <div
        className="score-lockup score-lockup--pending"
        aria-label={pendingLabel}
      >
        <span className="grade-badge grade-pending">—</span>
        <div className="score-lockup-text">
          <strong>{pendingLabel}</strong>
        </div>
      </div>
    )
  }

  const safeScore = score ?? 0
  const level = grade ? overallGradeLabels[grade] : 'Ukjent nivå'

  if (compact) {
    return (
      <div className="score-lockup score-lockup--compact" aria-label={`${scoreLabel}: ${safeScore} av ${maxPoints}, karakter ${grade}`}>
        <span className={gradeClass(grade)}>{grade}</span>
        <div className="score-lockup-text">
          <strong>{safeScore}</strong>
          <span> av {maxPoints}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="score-lockup" aria-label={`${scoreLabel}: ${safeScore} av ${maxPoints}, karakter ${grade}`}>
      <span className={gradeClass(grade)}>{grade}</span>
      <div className="score-lockup-text">
        <strong>{scoreLabel}: {safeScore} / {maxPoints}</strong>
        <span>Kvalitetsnivå: {grade} – {level}</span>
      </div>
    </div>
  )
}
