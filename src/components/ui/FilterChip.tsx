type FilterChipProps = {
  label: string
  active?: boolean
  onClick: () => void
  ariaLabel?: string
}

export default function FilterChip({ label, active = false, onClick, ariaLabel }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`ui-filter-chip${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
