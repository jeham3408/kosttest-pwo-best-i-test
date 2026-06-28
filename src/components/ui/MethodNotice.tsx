import type { ReactNode } from 'react'

type MethodNoticeProps = {
  title?: string
  children: ReactNode
  variant?: 'info' | 'warning'
}

export default function MethodNotice({ title = 'Om metoden', children, variant = 'info' }: MethodNoticeProps) {
  return (
    <aside className={`ui-method-notice ui-method-notice--${variant}`} aria-label={title}>
      <strong>{title}</strong>
      <div className="ui-method-notice-body">{children}</div>
    </aside>
  )
}
