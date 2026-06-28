import { GitCompare } from 'lucide-react'

type CompareEmptyStateProps = {
  count: number
  max: number
}

export default function CompareEmptyState({ count, max }: CompareEmptyStateProps) {
  if (count === 0) {
    return (
      <div className="compare-empty-state" role="status">
        <GitCompare size={32} aria-hidden="true" />
        <p>
          Vel to eller tre produkter for å se ingredienser, score, pris og dokumentasjon side om side.
        </p>
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className="compare-empty-state compare-empty-state--partial" role="status">
        <p>Ett produkt valgt — velg minst ett til (maks {max}).</p>
      </div>
    )
  }

  return null
}
