import { useId, useState } from 'react'
import { ChevronDown, ExternalLink, History } from 'lucide-react'
import { DATA_CONFIDENCE_KIND_LABELS, RANKING_STATUS_LABELS } from '../../data/trust/enums'
import type { ProductTrustSnapshot } from '../../data/trust/types'
import { TRUST_LEVEL_COPY } from '../../data/trust/labels'
import { formatChangeSummary } from '../../data/trust/changeLog'
import ProductDataStatus from './ProductDataStatus'
import ProductFeedbackForm from './ProductFeedbackForm'

type DataTransparencyPanelProps = {
  snapshot: ProductTrustSnapshot
  variant?: 'compact' | 'full' | 'drawer'
  showFeedback?: boolean
  className?: string
}

function DetailRow({
  label,
  value,
  explanation,
}: {
  label: string
  value: string
  explanation?: string
}) {
  return (
    <div className="data-transparency-row">
      <dt>{label}</dt>
      <dd>
        <span>{value}</span>
        {explanation ? <span className="data-transparency-hint">{explanation}</span> : null}
      </dd>
    </div>
  )
}

export default function DataTransparencyPanel({
  snapshot,
  variant = 'full',
  showFeedback = true,
  className = '',
}: DataTransparencyPanelProps) {
  const panelId = useId()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const trustCopy = TRUST_LEVEL_COPY[snapshot.trustLevel]
  const confidenceCopy = DATA_CONFIDENCE_KIND_LABELS[snapshot.dataConfidence]

  if (variant === 'compact') {
    return (
      <div className={`data-transparency-panel data-transparency-panel--compact ${className}`.trim()}>
        <ProductDataStatus snapshot={snapshot} compact />
      </div>
    )
  }

  const body = (
    <>
      <ProductDataStatus snapshot={snapshot} compact={false} />
      {snapshot.lastCheckedNote ? (
        <p className="data-transparency-note">{snapshot.lastCheckedNote}</p>
      ) : null}
      {snapshot.rankingStatus !== 'ranked' && (snapshot.rankingExclusionReason ?? snapshot.pendingReason) ? (
        <p className="data-transparency-pending" role="alert">
          <strong>{RANKING_STATUS_LABELS[snapshot.rankingStatus]}:</strong>{' '}
          {snapshot.rankingExclusionReason ?? snapshot.pendingReason}
        </p>
      ) : null}

      <dl className="data-transparency-dl">
        <DetailRow label="Sist kontrollert" value={snapshot.lastVerifiedAt} />
        <DetailRow label="Pris sist kontrollert" value={snapshot.lastPriceCheckedAt} />
        <DetailRow label="Deklarasjon sist kontrollert" value={snapshot.lastFormulaCheckedAt} />
        <DetailRow
          label="Datakilde"
          value={snapshot.dataSource}
          explanation={snapshot.dataSourceExplanation}
        />
        <DetailRow label="Datakvalitet" value={confidenceCopy.label} explanation={confidenceCopy.explanation} />
        <DetailRow label="Datatillit" value={trustCopy.label} explanation={trustCopy.explanation} />
        <DetailRow label="Laboratorietest" value={snapshot.labTestStatus} explanation={snapshot.labTestExplanation} />
        <DetailRow label="Batchtest" value={snapshot.batchTestStatus} />
        <DetailRow label="Dopingtest" value={snapshot.dopingTestStatus} />
        <DetailRow label="Råvare/kvalitet" value={snapshot.rawMaterialDocStatus} />
        <DetailRow label="Metodeversjon" value={snapshot.methodVersion} />
        <DetailRow label="Rangeringsstatus" value={RANKING_STATUS_LABELS[snapshot.rankingStatus]} />
      </dl>

      {snapshot.sourceLinks.length > 0 ? (
        <div className="data-transparency-sources">
          <h4>Åpne kilder</h4>
          <ul>
            {snapshot.sourceLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="data-transparency-missing-inline">Ingen kildelenker oppgitt per produkt.</p>
      )}

      {snapshot.missingFields.length > 0 ? (
        <div className="data-transparency-missing">
          <h4>Manglende eller uklare felt</h4>
          <ul>
            {snapshot.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="data-transparency-changelog" aria-labelledby={`${panelId}-changelog`}>
        <h4 id={`${panelId}-changelog`}>
          <History size={16} aria-hidden="true" />
          Endringslogg
        </h4>
        {snapshot.changeLog.length === 0 ? (
          <p className="muted">Ingen registrerte endringer i offentlig logg for dette produktet.</p>
        ) : (
          <ul>
            {snapshot.changeLog.map((entry) => (
              <li key={`${entry.date}-${entry.publicSummary}`}>
                {formatChangeSummary(entry)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showFeedback ? (
        <ProductFeedbackForm context={snapshot.feedbackContext} variant="inline" />
      ) : null}
    </>
  )

  if (variant === 'drawer') {
    return (
      <div className={`data-transparency-drawer ${className}`.trim()}>
        <button
          type="button"
          className="data-transparency-drawer-trigger"
          aria-expanded={drawerOpen}
          aria-controls={`${panelId}-drawer`}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <span>Data og tillit</span>
          <ChevronDown size={16} className={drawerOpen ? 'is-open' : ''} aria-hidden="true" />
        </button>
        {drawerOpen ? (
          <div id={`${panelId}-drawer`} className="data-transparency-drawer-body">
            {body}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <section
      className={`data-transparency-panel data-transparency-panel--full ${className}`.trim()}
      aria-labelledby={`${panelId}-heading`}
    >
      <h4 id={`${panelId}-heading`}>Data og tillit</h4>
      {body}
    </section>
  )
}
