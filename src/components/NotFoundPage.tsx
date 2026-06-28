import EmptyState from './ui/EmptyState'

type NotFoundPageProps = {
  title?: string
  description?: string
  onNavigateHome: () => void
  onNavigateTests?: () => void
}

export default function NotFoundPage({
  title = 'Siden finnes ikke',
  description = 'Lenken kan være utdatert, eller siden er flyttet. Prøv testoversikten eller forsiden.',
  onNavigateHome,
  onNavigateTests,
}: NotFoundPageProps) {
  return (
    <section className="content-section">
      <EmptyState
        title={title}
        description={description}
        tips={[
          'Sjekk stavingen i adressen',
          'Gå til PWO-, protein- eller kreatintesten fra menyen',
          'Rapporter feil data hvis du tror produktet finnes hos oss',
        ]}
        action={
          <div className="ui-empty-actions">
            <button type="button" className="button" onClick={onNavigateHome}>
              Til forsiden
            </button>
            {onNavigateTests ? (
              <button type="button" className="button secondary" onClick={onNavigateTests}>
                Se tester
              </button>
            ) : null}
          </div>
        }
      />
    </section>
  )
}
