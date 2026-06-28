import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type ErrorStateProps = {
  title?: string
  message: string
  action?: ReactNode
}

export default function ErrorState({ title = 'Noe gikk galt', message, action }: ErrorStateProps) {
  return (
    <div className="ui-error-state" role="alert">
      <AlertTriangle size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}
