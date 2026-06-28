import { listedProducts } from '../../data/pwoProducts'
import { getPendingReviewItems } from '../../data/trust'
import type { TestCategory } from '../../data/trust/types'
import ProductFeedbackForm from './ProductFeedbackForm'

const SECTION_COPY: Record<
  TestCategory,
  { title: string; intro: string }
> = {
  pwo: {
    title: 'Produkter som venter på kontroll',
    intro:
      'Disse produktene er funnet i norske butikker, men har ikke rangeringstall fordi vi mangler kontrollerbar deklarasjon eller full doseinformasjon. De får ikke «best for»-tekst eller kvalitetsbadge.',
  },
  protein: {
    title: 'Produkter som venter på kontroll',
    intro:
      'Disse proteinproduktene er synlige med DIAAS-estimat i hovedlisten, men venter på full kontroll av etikett, dose og pris. I denne seksjonen vises de uten rangeringstall og uten positive anbefalinger.',
  },
  creatine: {
    title: 'Produkter som venter på kontroll',
    intro:
      'Produkter som mangler sentrale dokumentasjonsfelt og ikke er klare for full vurdering.',
  },
}

type PendingReviewSectionProps = {
  category: TestCategory
}

export default function PendingReviewSection({ category }: PendingReviewSectionProps) {
  const pending = getPendingReviewItems(category, category === 'pwo' ? listedProducts : undefined)

  if (!pending.length) return null

  const copy = SECTION_COPY[category]

  return (
    <section className="content-section pending-review-section" id="venter-kontroll">
      <div className="section-heading">
        <span>Ikke rangert</span>
        <h2>{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>

      <ul className="pending-review-list" role="list">
        {pending.map((item) => (
          <li key={item.id} className="pending-review-card" role="listitem">
            <div className="pending-review-card-head">
              <div>
                <strong>{item.name}</strong>
                <span className="pending-review-brand">
                  {item.brand} · {item.merchant}
                </span>
              </div>
              <span className="pending-review-status">{item.status}</span>
            </div>
            <p className="pending-review-reason">
              <strong>Hvorfor ikke rangert:</strong> {item.reason}
            </p>
            {item.missingFields.length > 0 ? (
              <div className="pending-review-missing">
                <strong>Mangler:</strong>
                <ul>
                  {item.missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" className="pending-review-link">
                Se produktside
              </a>
            ) : null}
            <ProductFeedbackForm
              variant="button"
              context={{
                category: item.category,
                productId: item.id,
                slug: item.id,
                productName: item.name,
                lastChecked: 'Ikke oppgitt per produkt',
                productUrl: item.url,
                pageUrl:
                  item.category === 'protein'
                    ? `/protein/${item.id}/`
                    : item.category === 'creatine'
                      ? `/kreatin/${item.id}/`
                      : '/tester/pwo/',
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
