import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
  className?: string
}

/** Standard sidehode — én H1 per side. */
export default function PageHeader({ eyebrow, title, lead, children, className = '' }: PageHeaderProps) {
  return (
    <header className={`ui-page-header ${className}`.trim()}>
      {eyebrow ? <p className="ui-page-header-eyebrow">{eyebrow}</p> : null}
      <h1 className="ui-page-header-title">{title}</h1>
      {lead ? <p className="ui-page-header-lead">{lead}</p> : null}
      {children}
    </header>
  )
}
