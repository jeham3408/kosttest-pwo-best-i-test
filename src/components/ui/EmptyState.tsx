import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  tips?: string[]
  action?: ReactNode
}

export default function EmptyState({ title, description, tips, action }: EmptyStateProps) {
  return (
    <div className="ui-empty-state" role="status">
      <h1 className="ui-empty-state-title">{title}</h1>
      {description ? <p>{description}</p> : null}
      {tips?.length ? (
        <ul>
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
      {action}
    </div>
  )
}
