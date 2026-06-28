import { lastUpdated, lastUpdatedIso } from '../data/siteMeta'

export default function LastUpdatedNotice() {
  return (
    <p className="last-updated-notice">
      <strong>Sist kontrollert:</strong>{' '}
      <time dateTime={lastUpdatedIso}>{lastUpdated}</time>
      . Priser og etiketter kan endre seg —{' '}
      <a href="/hvor-ferske-er-dataene/">se datatillit per produkt</a>.
    </p>
  )
}
