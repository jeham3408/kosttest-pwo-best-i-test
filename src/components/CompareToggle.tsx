import { GitCompare } from 'lucide-react'
import type { CompareCategory } from '../compare'

type CompareToggleProps = {
  category: CompareCategory
  productId: string
  selected: boolean
  disabled?: boolean
  onToggle: (category: CompareCategory, id: string) => void
}

export default function CompareToggle({
  category,
  productId,
  selected,
  disabled = false,
  onToggle,
}: CompareToggleProps) {
  return (
    <button
      type="button"
      className={`compare-toggle${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      aria-label={
        selected
          ? 'Fjern fra sammenligning'
          : 'Legg til i sammenligning — maks tre produkter i samme kategori'
      }
      disabled={disabled && !selected}
      onClick={(event) => {
        event.stopPropagation()
        onToggle(category, productId)
      }}
    >
      <GitCompare size={14} aria-hidden="true" />
      {selected ? 'Valgt' : 'Sammenlign'}
    </button>
  )
}
