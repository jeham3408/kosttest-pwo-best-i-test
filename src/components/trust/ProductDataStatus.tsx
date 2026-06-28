import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { DATA_CONFIDENCE_KIND_LABELS } from '../../data/trust/enums'
import type { ProductTrustSnapshot } from '../../data/trust/types'
import type { DataTrustLevel } from '../../data/trust/types'
import { MISSING_VALUE, TRUST_LEVEL_COPY } from '../../data/trust/labels'
import { lastUpdated } from '../../data/siteMeta'

const iconByLevel: Record<DataTrustLevel, typeof Shield> = {
  high: ShieldCheck,
  medium: Shield,
  limited: ShieldAlert,
  unranked: ShieldQuestion,
}

type ProductDataStatusProps = {
  /** Foretrukket — full snapshot */
  snapshot?: ProductTrustSnapshot
  /** Legacy props */
  trustLevel?: DataTrustLevel
  lastChecked?: string
  dataSource?: string
  compact?: boolean
  /** Én linje for tabellceller — f.eks. «Høy tillit · Etikett». */
  chip?: boolean
  className?: string
}

export default function ProductDataStatus({
  snapshot,
  trustLevel: trustLevelProp,
  lastChecked: lastCheckedProp,
  dataSource: dataSourceProp,
  compact = true,
  chip = false,
  className = '',
}: ProductDataStatusProps) {
  const trustLevel = snapshot?.trustLevel ?? trustLevelProp ?? 'medium'
  const lastChecked = snapshot?.lastVerifiedAt ?? lastCheckedProp
  const dataSourceShort = snapshot?.dataSourceShort ?? dataSourceProp
  const dataConfidence = snapshot?.dataConfidence
  const confidenceShort = dataConfidence ? DATA_CONFIDENCE_KIND_LABELS[dataConfidence].short : undefined
  const missingPerProduct =
    !lastChecked || lastChecked === MISSING_VALUE || lastChecked === 'Ikke oppgitt per produkt'

  const copy = TRUST_LEVEL_COPY[trustLevel]
  const Icon = iconByLevel[trustLevel]

  const chipLabel = [
    confidenceShort ?? (trustLevel === 'unranked' ? 'Ikke vurdert' : copy.short),
    dataSourceShort,
  ]
    .filter(Boolean)
    .join(' · ')

  const chipTitle = [
    missingPerProduct
      ? `Felles testgjennomgang: ${lastUpdated}. Produktspesifikk kontroll ikke registrert.`
      : `Sist kontrollert: ${lastChecked}.`,
    copy.explanation,
    dataSourceShort ? `Kilde: ${dataSourceShort}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (chip) {
    return (
      <span
        className={`product-data-status-chip product-data-status-chip--${trustLevel} ${className}`.trim()}
        role="status"
        title={chipTitle}
        aria-label={chipTitle}
      >
        <Icon size={12} aria-hidden="true" className="product-data-status-chip-icon" />
        {chipLabel}
      </span>
    )
  }

  if (compact) {
    return (
      <div
        className={`product-data-status product-data-status--${trustLevel} product-data-status--compact ${className}`.trim()}
        role="status"
        aria-label={[
          missingPerProduct
            ? `Felles testgjennomgang: ${lastUpdated}.`
            : `Sist kontrollert: ${lastChecked}.`,
          confidenceShort ? `Datastatus: ${confidenceShort}.` : copy.short,
          dataSourceShort ? `Kilde: ${dataSourceShort}.` : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Icon size={14} aria-hidden="true" className="product-data-status-icon" />
        <div className="product-data-status-text product-data-status-text--compact">
          {missingPerProduct ? (
            <>
              <span className="product-data-status-line">
                <strong>Felles testgjennomgang:</strong> {lastUpdated}
              </span>
              <span className="product-data-status-line">
                <strong>Produktspesifikk kontroll:</strong> ikke registrert
              </span>
            </>
          ) : (
            <span className="product-data-status-line">
              <strong>Sist kontrollert:</strong> {lastChecked}
            </span>
          )}
          <span className="product-data-status-line">
            <strong>Datastatus:</strong>{' '}
            {confidenceShort ?? (trustLevel === 'unranked' ? 'Ikke fullt vurdert' : copy.short.toLowerCase())}
          </span>
          {dataSourceShort ? (
            <span className="product-data-status-line">
              <strong>Kilde:</strong> {dataSourceShort}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`product-data-status product-data-status--${trustLevel} ${className}`.trim()}
      role="status"
      aria-label={`${copy.label}. ${copy.explanation}${lastChecked ? ` Sist kontrollert: ${lastChecked}.` : ''}`}
    >
      <Icon size={18} aria-hidden="true" className="product-data-status-icon" />
      <div className="product-data-status-text">
        <span className="product-data-status-label">{copy.label}</span>
        <span className="product-data-status-explain">{copy.explanation}</span>
        {lastChecked ? (
          <span className="product-data-status-meta">Sist kontrollert: {lastChecked}</span>
        ) : null}
        {dataSourceShort ? (
          <span className="product-data-status-meta">Kilde: {dataSourceShort}</span>
        ) : null}
        {confidenceShort ? (
          <span className="product-data-status-meta">Datastatus: {confidenceShort}</span>
        ) : null}
      </div>
    </div>
  )
}

export function TrustLevelExplainer() {
  return (
    <div className="trust-level-explainer" aria-labelledby="trust-explainer-heading">
      <h3 id="trust-explainer-heading">Hva betyr datatillit?</h3>
      <ul>
        {(Object.keys(TRUST_LEVEL_COPY) as DataTrustLevel[]).map((level) => {
          const copy = TRUST_LEVEL_COPY[level]
          return (
            <li key={level}>
              <strong>{copy.label}:</strong> {copy.explanation}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
