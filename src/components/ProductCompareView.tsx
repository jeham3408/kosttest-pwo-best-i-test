import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Copy } from 'lucide-react'
import {
  buildCompareUrl,
  getCompareConfig,
  getSortedFields,
  trackCompareEvent,
  type CompareCategory,
  type CompareProductHeader,
} from '../compare'
import type { TestedProduct } from '../data/pwoProducts'
import AssessmentDisclaimer from './AssessmentDisclaimer'
import CompareDiffSection from './compare/CompareDiffSection'
import CompareEmptyState from './compare/CompareEmptyState'
import CompareMobileView from './compare/CompareMobileView'
import CompareProductHeaders from './compare/CompareProductHeaders'
import CompareTable from './compare/CompareTable'

type ProductCompareViewProps = {
  category: CompareCategory
  ids: string[]
  onBack: () => void
  onSelectProduct: (id: string) => void
  onRemoveProduct: (id: string) => void
  onIdsChange: (ids: string[]) => void
}

export default function ProductCompareView({
  category,
  ids,
  onBack,
  onSelectProduct,
  onRemoveProduct,
  onIdsChange,
}: ProductCompareViewProps) {
  const config = getCompareConfig(category)
  const fields = useMemo(() => getSortedFields(category), [category])
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const products = useMemo(() => config.resolveProducts(ids), [config, ids])

  const invalidIds = useMemo(() => {
    const found = new Set(products.map((p) => p.id))
    return ids.filter((id) => !found.has(id))
  }, [ids, products])

  const diffBullets = useMemo(
    () => (products.length >= 2 ? config.generateDiff(products) : []),
    [config, products],
  )

  const getCellValue = useCallback(
    (field: (typeof fields)[0], product: CompareProductHeader) => field.getValue(product),
    [fields],
  )

  const shareUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}${buildCompareUrl(category, products.map((p) => p.id))}`
        : buildCompareUrl(category, products.map((p) => p.id)),
    [category, products],
  )

  const handleShare = async () => {
    trackCompareEvent({
      type: 'compare_share',
      category,
      productIds: products.map((p) => p.id),
    })
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2500)
    } catch {
      setCopyStatus('error')
    }
  }

  const handleRemove = (id: string) => {
    onRemoveProduct(id)
    onIdsChange(ids.filter((x) => x !== id))
  }

  const pwoScores =
    category === 'pwo'
      ? (products as TestedProduct[]).map((p) => ({
          score: p.score,
          grade: p.overallGrade,
          max: 84,
        }))
      : undefined

  return (
    <section className="content-section compare-page">
      <button type="button" className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Tilbake til rangering
      </button>

      <div className="section-heading">
        <span>Sammenligning</span>
        <h1>{config.title}</h1>
        <p className="compare-intro">
          Sammenligningen viser deklarerte produktdata og Kosttest sin åpne vurderingsmodell. Den erstatter
          ikke individuell rådgiving, og manglende dokumentasjon er markert som manglende — ikke
          automatisk som lav kvalitet.
        </p>
      </div>

      <AssessmentDisclaimer className="assessment-disclaimer--spaced" category={category} />

      {invalidIds.length > 0 ? (
        <p className="compare-invalid-notice" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {invalidIds.length} produkt finnes ikke lenger i testen og er hoppet over.
        </p>
      ) : null}

      {products.length < 2 ? (
        <CompareEmptyState count={products.length} max={3} />
      ) : (
        <>
          <div className="compare-toolbar">
            <button type="button" className="button secondary" onClick={handleShare}>
              <Copy size={16} aria-hidden="true" />
              {copyStatus === 'copied' ? 'Lenke kopiert' : copyStatus === 'error' ? 'Kunne ikke kopiere' : 'Del sammenligning'}
            </button>
          </div>

          <CompareDiffSection bullets={diffBullets} />

          <CompareProductHeaders
            category={category}
            products={products}
            scores={pwoScores}
            onSelect={onSelectProduct}
            onRemove={handleRemove}
            onExternalLink={(p) =>
              trackCompareEvent({
                type: 'compare_external_link',
                category,
                productId: p.id,
                merchant: p.merchant ?? 'butikk',
              })
            }
          />

          {isMobile ? (
            <CompareMobileView fields={fields} products={products} getCellValue={getCellValue} />
          ) : (
            <CompareTable fields={fields} products={products} getCellValue={getCellValue} />
          )}
        </>
      )}
    </section>
  )
}
