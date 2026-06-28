import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

type MobileBottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  titleId?: string
  children: ReactNode
  footer?: ReactNode
}

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  titleId: titleIdProp,
  children,
  footer,
}: MobileBottomSheetProps) {
  const autoId = useId()
  const titleId = titleIdProp ?? `sheet-title-${autoId}`
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ui-sheet-root" role="presentation">
      <button
        type="button"
        className="ui-sheet-backdrop"
        aria-label="Lukk panel"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="ui-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ui-sheet-handle" aria-hidden="true" />
        <header className="ui-sheet-header">
          <h2 id={titleId} className="ui-sheet-title">
            {title}
          </h2>
          <button type="button" className="ui-sheet-close" aria-label="Lukk" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="ui-sheet-body">{children}</div>
        {footer ? <footer className="ui-sheet-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
