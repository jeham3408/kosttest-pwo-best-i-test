type LoadingStateProps = {
  label?: string
}

export default function LoadingState({ label = 'Laster …' }: LoadingStateProps) {
  return (
    <div className="ui-loading-state" role="status" aria-live="polite" aria-busy="true">
      <span className="ui-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
