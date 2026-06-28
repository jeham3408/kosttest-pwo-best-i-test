import { GitCompare, X } from 'lucide-react'
import type { CompareCategory } from '../compare'

export type CompareBarItem = {
  id: string
  name: string
}

type ProductCompareBarProps = {
  category: CompareCategory
  count: number
  max: number
  items: CompareBarItem[]
  onCompare: () => void
  onClear: () => void
  onRemove: (id: string) => void
}

const labels: Record<CompareCategory, string> = {
  pwo: 'PWO',
  protein: 'protein',
  creatine: 'kreatin',
}

export default function ProductCompareBar({
  category,
  count,
  max,
  items,
  onCompare,
  onClear,
  onRemove,
}: ProductCompareBarProps) {
  if (count === 0) return null

  return (
    <div className="compare-bar" role="region" aria-label="Sammenligningslinje" aria-live="polite">
      <div className="compare-bar-main">
        <GitCompare size={18} className="compare-bar-icon" aria-hidden="true" />
        <span className="compare-bar-count">
          {count} av {max} {labels[category]}-produkt valgt
        </span>
        <ul className="compare-bar-chips" aria-label="Valgte produkter">
          {items.map((item) => (
            <li key={item.id}>
              <span className="compare-bar-chip">
                <span className="compare-bar-chip-label">{item.name}</span>
                <button
                  type="button"
                  className="compare-bar-chip-remove"
                  aria-label={`Fjern ${item.name} fra sammenligning`}
                  onClick={() => onRemove(item.id)}
                >
                  <X size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="compare-bar-actions">
        {count === 1 ? (
          <span className="compare-bar-hint">Velg ett til produkt</span>
        ) : null}
        <button type="button" className="button secondary compare-bar-clear" onClick={onClear}>
          Tøm
        </button>
        <button
          type="button"
          className="button primary"
          disabled={count < 2}
          aria-disabled={count < 2}
          onClick={onCompare}
        >
          Sammenlign{count >= 2 ? ` (${count})` : ''}
        </button>
      </div>
    </div>
  )
}
