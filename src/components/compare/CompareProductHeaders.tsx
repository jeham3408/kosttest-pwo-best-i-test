import { ExternalLink } from 'lucide-react'
import { PWO_FORMULA_MAX_POINTS } from '../../data/pwoProducts'
import type { CompareCategory, CompareProductHeader } from '../../compare'
import ProductImage from '../ProductImage'
import ScoreLockup from '../ScoreLockup'
import type { GradeLetter } from '../../data/pwoProducts'

type CompareProductHeadersProps = {
  category: CompareCategory
  products: CompareProductHeader[]
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onExternalLink?: (product: CompareProductHeader) => void
  scores?: Array<{ score: number; grade?: GradeLetter; max?: number }>
}

export default function CompareProductHeaders({
  category,
  products,
  onSelect,
  onRemove,
  onExternalLink,
  scores,
}: CompareProductHeadersProps) {
  const altSuffix = category === 'pwo' ? 'PWO' : category === 'protein' ? 'protein' : 'kreatin'

  return (
    <div className="compare-product-headers" role="list" aria-label="Valde produkt">
      {products.map((p, index) => (
        <article key={p.id} className="compare-product-card" role="listitem">
          <button type="button" className="compare-product-card-main" onClick={() => onSelect(p.id)}>
            <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix={altSuffix} />
            <strong>{p.name}</strong>
            <span>{p.brand}</span>
            {scores?.[index] ? (
              <ScoreLockup
                grade={scores[index].grade}
                score={scores[index].score}
                maxPoints={scores[index].max ?? PWO_FORMULA_MAX_POINTS}
                compact
              />
            ) : null}
          </button>
          <div className="compare-product-card-actions">
            <button
              type="button"
              className="button secondary compare-remove-btn"
              aria-label={`Fjern ${p.name} fra sammenligning`}
              onClick={() => onRemove(p.id)}
            >
              Fjern
            </button>
            {p.url && onExternalLink ? (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="compare-external-link"
                aria-label={`Opne ${p.name} hos ${p.merchant ?? 'butikk'} i ny fane`}
                onClick={() => onExternalLink(p)}
              >
                {p.merchant ?? 'Butikk'}
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
