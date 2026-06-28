import type { GradeLetter } from '../data/pwoProducts'
import { overallGradeLabels } from '../data/pwoProducts'

const gradeClass = (grade: GradeLetter | undefined) => `grade-badge grade-${grade ?? 'F'}`

type ScoreLockupProps = {
  grade: GradeLetter | undefined
  score: number
  maxPoints: number
  scoreLabel?: string
  compact?: boolean
}

export default function ScoreLockup({
  grade,
  score,
  maxPoints,
  scoreLabel = 'Formelscore',
  compact = false,
}: ScoreLockupProps) {
  const level = grade ? overallGradeLabels[grade] : 'Ukjent nivå'

  if (compact) {
    return (
      <div className="score-lockup score-lockup--compact" aria-label={`${scoreLabel}: ${score} av ${maxPoints}, karakter ${grade}`}>
        <span className={gradeClass(grade)}>{grade}</span>
        <div className="score-lockup-text">
          <strong>{score}</strong>
          <span> av {maxPoints}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="score-lockup" aria-label={`${scoreLabel}: ${score} av ${maxPoints}, karakter ${grade}`}>
      <span className={gradeClass(grade)}>{grade}</span>
      <div className="score-lockup-text">
        <strong>{scoreLabel}: {score} / {maxPoints}</strong>
        <span>Kvalitetsnivå: {grade} – {level}</span>
      </div>
    </div>
  )
}
