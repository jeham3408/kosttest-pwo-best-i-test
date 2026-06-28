import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import MobileBottomSheet from './MobileBottomSheet'

type FilterPanelShellProps = {
  title?: string
  activeCount: number
  resultCount: number
  totalCount: number
  onReset?: () => void
  children: ReactNode
  className?: string
}

export default function FilterPanelShell({
  title = 'Filter og sortering',
  activeCount,
  resultCount,
  totalCount,
  onReset,
  children,
  className = '',
}: FilterPanelShellProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [open, setOpen] = useState(false)

  const summary = (
    <div className="ui-filter-summary">
      <span className="ui-filter-summary-text">
        Viser <strong>{resultCount}</strong> av {totalCount} produkt
        {activeCount > 0 ? (
          <>
            {' '}
            · <span className="ui-filter-active-badge">{activeCount} filter aktive</span>
          </>
        ) : null}
      </span>
      {activeCount > 0 && onReset ? (
        <button type="button" className="button secondary ui-filter-reset" onClick={onReset}>
          Nullstill
        </button>
      ) : null}
    </div>
  )

  if (!isMobile) {
    return (
      <div className={`ui-filter-shell ui-filter-shell--desktop ${className}`.trim()}>
        {summary}
        <div className="ui-filter-content">{children}</div>
      </div>
    )
  }

  return (
    <div className={`ui-filter-shell ui-filter-shell--mobile ${className}`.trim()}>
      {summary}
      <button
        type="button"
        className="ui-filter-open-btn"
        aria-expanded={open}
        aria-controls="filter-sheet-panel"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        {title}
        {activeCount > 0 ? <span className="ui-filter-open-count">{activeCount}</span> : null}
      </button>
      <MobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <button type="button" className="button primary ui-filter-apply" onClick={() => setOpen(false)}>
            Vis {resultCount} produkt
          </button>
        }
      >
        <div id="filter-sheet-panel" className="ui-filter-sheet-content">
          {children}
        </div>
      </MobileBottomSheet>
    </div>
  )
}
