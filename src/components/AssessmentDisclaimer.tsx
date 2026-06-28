import {
  CATEGORY_METHOD_LINK,
  CATEGORY_METHOD_SUMMARY,
  METHOD_DISCLOSURE_BODY,
  METHOD_DISCLOSURE_MISSING_DATA,
  METHOD_DISCLOSURE_TITLE,
  type MethodDisclosureCategory,
} from '../data/methodDisclosureCopy'

type AssessmentDisclaimerProps = {
  className?: string
  category?: MethodDisclosureCategory
}

/** Metode- og troverdighetsforklaring for kategori- og produktsider. */
export default function AssessmentDisclaimer({
  className = '',
  category = 'general',
}: AssessmentDisclaimerProps) {
  const summary = CATEGORY_METHOD_SUMMARY[category]
  const methodLink = CATEGORY_METHOD_LINK[category]

  return (
    <aside
      className={`assessment-disclaimer ${className}`.trim()}
      aria-labelledby="method-disclosure-title"
    >
      <strong id="method-disclosure-title">{METHOD_DISCLOSURE_TITLE}</strong>
      {summary ? <p className="assessment-disclaimer-summary">{summary}</p> : null}
      <p>{METHOD_DISCLOSURE_BODY}</p>
      <p>{METHOD_DISCLOSURE_MISSING_DATA}</p>
      <p className="assessment-disclaimer-link">
        <a href={methodLink.href}>{methodLink.label}</a>
      </p>
    </aside>
  )
}
