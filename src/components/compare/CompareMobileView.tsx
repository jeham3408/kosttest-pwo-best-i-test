import { useRef, useState } from 'react'
import type { CompareCell, CompareFieldDef, CompareProductHeader } from '../../compare/types'
import { computeRowHighlight, highlightLabel } from '../../compare/highlight'

type CompareMobileViewProps<T extends CompareProductHeader> = {
  fields: CompareFieldDef<T>[]
  products: T[]
  getCellValue: (field: CompareFieldDef<T>, product: T) => CompareCell
}

export default function CompareMobileView<T extends CompareProductHeader>({
  fields,
  products,
  getCellValue,
}: CompareMobileViewProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const goTo = (index: number) => {
    setActiveIndex(index)
    const el = scrollRef.current?.querySelector(`[data-compare-index="${index}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <div className="compare-mobile" role="region" aria-label="Mobil sammenligning">
      <div className="compare-mobile-tabs" role="tablist" aria-label="Vel produkt å se">
        {products.map((p, index) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            className={`compare-mobile-tab${activeIndex === index ? ' is-active' : ''}`}
            onClick={() => goTo(index)}
          >
            {p.name.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      <div className="compare-mobile-scroll" ref={scrollRef}>
        {products.map((product, productIndex) => (
          <article
            key={product.id}
            className="compare-mobile-card"
            data-compare-index={productIndex}
            aria-label={`Sammenligning for ${product.name}`}
          >
            <h3 className="compare-mobile-card-title">{product.name}</h3>
            <p className="compare-mobile-card-brand">{product.brand}</p>
            <dl className="compare-mobile-dl">
              {fields.map((field) => {
                const values = products.map((p) => getCellValue(field, p))
                const cell = values[productIndex]
                const rowHighlight = computeRowHighlight(field, products, values)
                let highlight: 'best' | 'worst' | null = null
                if (rowHighlight?.best.includes(productIndex)) highlight = 'best'
                else if (rowHighlight?.worst.includes(productIndex)) highlight = 'worst'
                const hl = highlight ? highlightLabel(highlight) : null
                return (
                  <div key={field.key} className={`compare-mobile-row compare-cell--${cell.kind}`}>
                    <dt>{field.label}</dt>
                    <dd>
                      {hl ? <span className="compare-cell-marker" aria-hidden="true">{hl.symbol}</span> : null}
                      {cell.display}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
