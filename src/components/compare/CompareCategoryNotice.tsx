type CompareCategoryNoticeProps = {
  message: string | null
  onDismiss: () => void
}

export default function CompareCategoryNotice({ message, onDismiss }: CompareCategoryNoticeProps) {
  if (!message) return null

  return (
    <div className="compare-category-notice" role="alert">
      <p>{message}</p>
      <button type="button" className="button secondary" onClick={onDismiss}>
        Lukk
      </button>
    </div>
  )
}
