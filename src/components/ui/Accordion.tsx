import type { ReactNode } from 'react'

type AccordionItemProps = {
  id: string
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ id, title, children, defaultOpen = false }: AccordionItemProps) {
  return (
    <details className="ui-accordion-item" open={defaultOpen || undefined}>
      <summary id={`${id}-summary`}>{title}</summary>
      <div className="ui-accordion-panel" id={id} role="region" aria-labelledby={`${id}-summary`}>
        {children}
      </div>
    </details>
  )
}

type AccordionProps = {
  label: string
  children: ReactNode
}

export default function Accordion({ label, children }: AccordionProps) {
  return (
    <div className="ui-accordion" aria-label={label}>
      {children}
    </div>
  )
}
