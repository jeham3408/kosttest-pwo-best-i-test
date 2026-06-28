import { useId, type ReactNode } from 'react'

type TooltipProps = {
  content: string
  children: ReactNode
}

/** Tooltip med synleg tekst-fallback via title og aria-describedby. */
export default function Tooltip({ content, children }: TooltipProps) {
  const id = useId()
  return (
    <span className="ui-tooltip-wrap">
      <span aria-describedby={id} title={content}>
        {children}
      </span>
      <span id={id} role="tooltip" className="ui-tooltip-content">
        {content}
      </span>
    </span>
  )
}
