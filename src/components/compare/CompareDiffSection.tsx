import { Lightbulb } from 'lucide-react'

export default function CompareDiffSection({ bullets }: { bullets: string[] }) {
  if (!bullets.length) return null

  return (
    <section className="compare-diff-section" aria-labelledby="compare-diff-heading">
      <h2 id="compare-diff-heading">
        <Lightbulb size={20} aria-hidden="true" />
        Viktigaste skilnader
      </h2>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  )
}
